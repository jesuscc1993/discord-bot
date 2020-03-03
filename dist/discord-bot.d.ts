import { ActivityOptions, Client, Message, MessageOptions, StringResolvable } from 'discord.js';
import { DiscordBotSettings } from './discord-bot.types';
export declare class DiscordBot {
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
    private client;
    constructor(discordBotSettings: DiscordBotSettings);
    getClient(): Client;
    setActivityMessage(activityMessage: string, activityOptions: ActivityOptions): void;
    private onGuildUpdate;
    private leaveGuildsSuspectedAsBotFarms;
    private leaveGuildWhenSuspectedAsBotFarm;
    private onError;
    private log;
    private error;
    onWrongParameterCount(message: Message): void;
    sendMessage(message: Message, messageContent: StringResolvable, messageOptions?: MessageOptions): void;
    sendError(message: Message, error: Error | string): void;
}
