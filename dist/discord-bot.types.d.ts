import { Guild, Message } from 'discord.js';
export declare type DiscordBotLogger = {
    error: (error: Error | string) => void;
    info: (message: string) => void;
    warn: (message: string) => void;
};
export declare type DiscordBotCommandMetadata = {
    commandIndex: number;
    lineIndex: number;
};
export declare type DiscordBotCommand = (message: Message, input: string, parameters: string[], metadata: DiscordBotCommandMetadata) => void;
export declare type DiscordBotSettings = {
    botAuthToken: string;
    botCommands: {
        [name: string]: DiscordBotCommand;
    };
    botPrefix: string;
    botPrefixDefault?: string;
    logger: DiscordBotLogger;
    maximumGuildBotsPercentage?: number;
    minimumGuildMembersForFarmCheck?: number;
    onGuildJoined?: (guild: Guild) => void;
    onGuildLeft?: (guild: Guild) => void;
    onLoad?: () => void;
    onMention?: (message: Message) => void;
};
