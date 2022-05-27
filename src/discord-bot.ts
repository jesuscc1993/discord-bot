import Discord, {
  ActivityOptions, Client, Guild, Message, MessageOptions, TextChannel,
} from 'discord.js';
import { from, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import {
  execute, getParametersFromLine, lineContainsPrefix, messageContainsPrefix,
} from './discord-bot.domain';
import { DiscordBotSettings } from './discord-bot.types';

export class DiscordBot {
  readonly botAuthToken: DiscordBotSettings['botAuthToken'];
  readonly botCommands: DiscordBotSettings['botCommands'];
  readonly botPrefix: DiscordBotSettings['botPrefix'];
  readonly botPrefixDefault: DiscordBotSettings['botPrefixDefault'];
  readonly logger: DiscordBotSettings['logger'];
  readonly maximumGuildBotsPercentage?: DiscordBotSettings['maximumGuildBotsPercentage'];
  readonly minimumGuildMembersForFarmCheck?: DiscordBotSettings['minimumGuildMembersForFarmCheck'];
  readonly onGuildJoined?: DiscordBotSettings['onGuildJoined'];
  readonly onGuildLeft?: DiscordBotSettings['onGuildLeft'];
  readonly onLoad?: DiscordBotSettings['onLoad'];
  readonly onMention?: DiscordBotSettings['onMention'];

  private client: Client;

  constructor(discordBotSettings: DiscordBotSettings) {
    Object.assign(this, discordBotSettings);

    this.client = new Discord.Client(discordBotSettings.clientOptions);

    this.client.on('error', (error) => this.onError(error));

    this.client.on('ready', () => {
      execute(this.onLoad);
      this.leaveGuildsSuspectedAsBotFarms();
    });

    this.client.on('guildCreate', (guild) => {
      this.log(`Joined guild "${guild.name}"`);
      this.onGuildUpdate(guild);
      execute(this.onGuildJoined, guild);
    });
    this.client.on('guildMemberAdd', (member) => member.guild && this.onGuildUpdate(member.guild));
    this.client.on('guildMemberRemove', (member) => member.guild && this.onGuildUpdate(member.guild));
    this.client.on('guildDelete', (guild) => {
      this.log(`Left guild "${guild.name}"`);
      execute(this.onGuildLeft, guild);
    });

    this.client.on('messageCreate', (message) => {
      if (message.author?.bot || !message.content) return;

      if (
        messageContainsPrefix(message.content, this.botPrefix) ||
        (this.botPrefixDefault && messageContainsPrefix(message.content, this.botPrefixDefault))
      ) {
        let commandIndex = 0;
        message.content.split('\n').forEach((line, lineIndex) => {
          if (lineContainsPrefix(line, `${this.botPrefix} `)) {
            const command = line.substring(this.botPrefix.length + 1).split(' ')[0];
            const parsedLine = line.substring(this.botPrefix.length + 1 + command.length);
            execute(this.botCommands[command], message, line, getParametersFromLine(parsedLine), {
              commandIndex,
              lineIndex,
            });
            commandIndex++;
          } else if (
            this.botCommands.default &&
            this.botPrefixDefault &&
            lineContainsPrefix(line, this.botPrefixDefault)
          ) {
            execute(this.botCommands.default, message, line, getParametersFromLine(line), {
              commandIndex,
              lineIndex: 0,
            });
            commandIndex++;
          }
        });
      } else if (this.client.user && message.mentions?.has(this.client.user)) {
        execute(this.onMention, message);
      }
    });

    from(this.client.login(this.botAuthToken))
      .pipe(catchError((error) => of(this.onError(error, 'client.login'))))
      .subscribe();
  }

  private onGuildUpdate(guild: Guild) {
    this.leaveGuildWhenSuspectedAsBotFarm(guild);
  }

  private leaveGuildsSuspectedAsBotFarms() {
    this.getGuilds().forEach((guild) => this.leaveGuildWhenSuspectedAsBotFarm(guild));
  }

  private leaveGuildWhenSuspectedAsBotFarm(guild: Guild) {
    const members = this.getMembers(guild);
    if (
      this.minimumGuildMembersForFarmCheck &&
      this.maximumGuildBotsPercentage &&
      members &&
      members.size > this.minimumGuildMembersForFarmCheck
    ) {
      const botCount = members.reduce((botCount, member) => botCount + (member.user.bot ? 1 : 0), 0);
      if ((botCount * 100) / members.size >= this.maximumGuildBotsPercentage) {
        from(guild.leave())
          .pipe(
            tap(() => this.log(`Server "${guild.name}" has been identified as a potential bot farm`)),
            catchError((error) => of(this.onError(error, 'guild.leave'))),
          )
          .subscribe();
      }
    }
  }

  private onError(error: Error | string, functionName?: string, parameters?: Array<any>) {
    let errorMessage: string = `"${error}" thrown`;
    if (functionName) {
      errorMessage += ` when calling ${functionName}`;
    }
    if (parameters) {
      errorMessage += ` with parameters: ${parameters.map((parameter) => JSON.stringify(parameter)).join(', ')}`;
    }
    this.error(`${errorMessage}.`);
  }

  private log(message: string) {
    this.logger.info(`DiscordBot: ${message}`);
  }

  private error(error: Error | string) {
    this.logger.error(`DiscordBot: ${error}`);
  }

  /* public */

  public getClient() {
    return this.client;
  }

  public getUser() {
    return this.client.user;
  }

  public getGuilds() {
    return this.client.guilds.cache;
  }

  public getMembers(guild: Guild) {
    return guild.members.cache;
  }

  public sendMessage(message: Message, messageContent?: string, messageOptions?: MessageOptions) {
    const { author, channel, guild } = message;

    if (guild && guild.me) {
      if (!guild.me.permissions.has('SEND_MESSAGES')) {
        const errorContent = `I do not have permission to send messages on server "${guild.name}".`;
        return from(author.send(errorContent))
          .pipe(
            catchError((error) => {
              return of(this.onError(error, 'message.author.send', [errorContent]));
            }),
          )
          .subscribe();
      }

      const textChannel = channel as TextChannel;

      if (guild.me && channel.isText() && !textChannel.permissionsFor(guild.me)?.has('SEND_MESSAGES')) {
        const errorContent = `I do not have permission to send messages on the "${textChannel.name}" channel on server "${guild.name}".`;
        return from(author.send(errorContent))
          .pipe(
            catchError((error) => {
              return of(this.onError(error, 'message.author.send', [errorContent]));
            }),
          )
          .subscribe();
      }
    }

    return from(channel.send({ ...messageOptions, content: messageContent }))
      .pipe(
        catchError((error) => {
          return of(this.onError(error, 'message.channel.send', [messageContent, messageOptions]));
        }),
      )
      .subscribe();
  }

  public sendError(message: Message, error: Error | string) {
    const errorMessage = (<Error>error).message || <string>error;
    this.sendMessage(message, undefined, {
      embeds: [
        {
          description: `**Error:** ${errorMessage || 'My apologies. I had some trouble processing your request.'}`,
          color: 15158332,
        },
      ],
    });
  }

  public setActivityMessage(activityMessage: string, activityOptions?: ActivityOptions) {
    if (this.client.user) {
      try {
        this.client.user.setActivity(activityMessage, activityOptions);
      } catch (error) {
        this.onError(error as Error, 'this.client.user.setActivity', [activityMessage, activityOptions]);
      }
    }
  }

  public onWrongParameterCount(message: Message) {
    this.sendMessage(message, `Invalid parameter count.`);
  }
}
