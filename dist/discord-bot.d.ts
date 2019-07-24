import { Client, Message, MessageOptions, StringResolvable } from 'discord.js';
import { DiscordBotSettings } from './discord-bot.types';
export declare class DiscordBot {
    readonly botPrefix: DiscordBotSettings['botPrefix'];
    readonly botPrefixDefault: DiscordBotSettings['botPrefixDefault'];
    readonly botAuthToken: DiscordBotSettings['botAuthToken'];
    readonly botCommands: DiscordBotSettings['botCommands'];
    readonly onGuildJoined?: DiscordBotSettings['onGuildJoined'];
    readonly onGuildLeft?: DiscordBotSettings['onGuildLeft'];
    readonly onMention?: DiscordBotSettings['onMention'];
    readonly logger: DiscordBotSettings['logger'];
    readonly maximumGuildBotsPercentage?: DiscordBotSettings['maximumGuildBotsPercentage'];
    readonly minimumGuildMembersForFarmCheck?: DiscordBotSettings['minimumGuildMembersForFarmCheck'];
    private client;
    constructor(discordBotSettings: DiscordBotSettings);
    getClient(): Client;
    private onGuildUpdate;
    private leaveGuildWhenSuspectedAsBotFarm;
    private setActivityMessage;
    private onError;
    private log;
    private error;
    onWrongParameterCount(message: Message): void;
    sendMessage(message: Message, messageContent: StringResolvable, messageOptions?: MessageOptions): void;
    sendError(message: Message, error: Error | string): void;
}
