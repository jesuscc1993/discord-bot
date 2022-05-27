import { ClientOptions, Guild, Message } from 'discord.js';

export type DiscordBotLogger = {
  error: (error: Error | string) => void;
  info: (message: string) => void;
  warn: (message: string) => void;
};

export type DiscordBotCommandMetadata = {
  commandIndex: number;
  lineIndex: number;
};

export type DiscordBotCommand = (
  message: Message,
  input: string,
  parameters: string[],
  metadata: DiscordBotCommandMetadata,
) => void;

export type DiscordBotSettings = {
  botAuthToken: string;
  botCommands: { [name: string]: DiscordBotCommand };
  botPrefix: string;
  botPrefixDefault?: string;
  clientOptions: ClientOptions;
  logger: DiscordBotLogger;
  maximumGuildBotsPercentage?: number;
  minimumGuildMembersForFarmCheck?: number;
  onGuildJoined?: (guild: Guild) => void;
  onGuildLeft?: (guild: Guild) => void;
  onLoad?: () => void;
  onMention?: (message: Message) => void;
};
