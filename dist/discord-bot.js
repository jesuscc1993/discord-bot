"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordBot = void 0;
var discord_js_1 = __importDefault(require("discord.js"));
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var discord_bot_domain_1 = require("./discord-bot.domain");
var DiscordBot = /** @class */ (function () {
    function DiscordBot(discordBotSettings) {
        var _this = this;
        Object.assign(this, discordBotSettings);
        this.client = new discord_js_1.default.Client();
        this.client.on('error', function (error) { return _this.onError(error); });
        this.client.on('ready', function () {
            discord_bot_domain_1.execute(_this.onLoad);
            _this.leaveGuildsSuspectedAsBotFarms();
        });
        this.client.on('guildCreate', function (guild) {
            _this.log("Joined guild \"" + guild.name + "\"");
            _this.onGuildUpdate(guild);
            discord_bot_domain_1.execute(_this.onGuildJoined, guild);
        });
        this.client.on('guildMemberAdd', function (member) { return member.guild && _this.onGuildUpdate(member.guild); });
        this.client.on('guildMemberRemove', function (member) { return member.guild && _this.onGuildUpdate(member.guild); });
        this.client.on('guildDelete', function (guild) {
            _this.log("Left guild \"" + guild.name + "\"");
            discord_bot_domain_1.execute(_this.onGuildLeft, guild);
        });
        this.client.on('message', function (message) {
            var _a, _b;
            if (((_a = message.author) === null || _a === void 0 ? void 0 : _a.bot) || !message.content)
                return;
            if (discord_bot_domain_1.messageContainsPrefix(message.content, _this.botPrefix) ||
                (_this.botPrefixDefault && discord_bot_domain_1.messageContainsPrefix(message.content, _this.botPrefixDefault))) {
                var commandIndex_1 = 0;
                message.content.split('\n').forEach(function (line, lineIndex) {
                    if (discord_bot_domain_1.lineContainsPrefix(line, _this.botPrefix + " ")) {
                        var command = line.substring(_this.botPrefix.length + 1).split(' ')[0];
                        var parsedLine = line.substring(_this.botPrefix.length + 1 + command.length);
                        discord_bot_domain_1.execute(_this.botCommands[command], message, line, discord_bot_domain_1.getParametersFromLine(parsedLine), {
                            commandIndex: commandIndex_1,
                            lineIndex: lineIndex,
                        });
                        commandIndex_1++;
                    }
                    else if (_this.botCommands.default &&
                        _this.botPrefixDefault &&
                        discord_bot_domain_1.lineContainsPrefix(line, _this.botPrefixDefault)) {
                        discord_bot_domain_1.execute(_this.botCommands.default, message, line, discord_bot_domain_1.getParametersFromLine(line), {
                            commandIndex: commandIndex_1,
                            lineIndex: 0,
                        });
                        commandIndex_1++;
                    }
                });
            }
            else if (_this.client.user && ((_b = message.mentions) === null || _b === void 0 ? void 0 : _b.has(_this.client.user))) {
                discord_bot_domain_1.execute(_this.onMention, message);
            }
        });
        rxjs_1.from(this.client.login(this.botAuthToken))
            .pipe(operators_1.catchError(function (error) { return rxjs_1.of(_this.onError(error, 'client.login')); }))
            .subscribe();
    }
    DiscordBot.prototype.onGuildUpdate = function (guild) {
        this.leaveGuildWhenSuspectedAsBotFarm(guild);
    };
    DiscordBot.prototype.leaveGuildsSuspectedAsBotFarms = function () {
        var _this = this;
        this.getGuilds().forEach(function (guild) { return _this.leaveGuildWhenSuspectedAsBotFarm(guild); });
    };
    DiscordBot.prototype.leaveGuildWhenSuspectedAsBotFarm = function (guild) {
        var _this = this;
        var members = this.getMembers(guild);
        if (this.minimumGuildMembersForFarmCheck &&
            this.maximumGuildBotsPercentage &&
            members &&
            members.size > this.minimumGuildMembersForFarmCheck) {
            var botCount = members.reduce(function (botCount, member) { return botCount + (member.user.bot ? 1 : 0); }, 0);
            if ((botCount * 100) / members.size >= this.maximumGuildBotsPercentage) {
                rxjs_1.from(guild.leave())
                    .pipe(operators_1.tap(function () { return _this.log("Server \"" + guild.name + "\" has been identified as a potential bot farm"); }), operators_1.catchError(function (error) { return rxjs_1.of(_this.onError(error, 'guild.leave')); }))
                    .subscribe();
            }
        }
    };
    DiscordBot.prototype.onError = function (error, functionName, parameters) {
        var errorMessage = "\"" + error + "\" thrown";
        if (functionName) {
            errorMessage += " when calling " + functionName;
        }
        if (parameters) {
            errorMessage += " with parameters: " + parameters.map(function (parameter) { return JSON.stringify(parameter); }).join(', ');
        }
        this.error(errorMessage + ".");
    };
    DiscordBot.prototype.log = function (message) {
        this.logger.info("DiscordBot: " + message);
    };
    DiscordBot.prototype.error = function (error) {
        this.logger.error("DiscordBot: " + error);
    };
    /* public */
    DiscordBot.prototype.getClient = function () {
        return this.client;
    };
    DiscordBot.prototype.getUser = function () {
        return this.client.user;
    };
    DiscordBot.prototype.getGuilds = function () {
        return this.client.guilds.cache;
    };
    DiscordBot.prototype.getMembers = function (guild) {
        return guild.members.cache;
    };
    DiscordBot.prototype.sendMessage = function (message, messageContent, messageOptions) {
        var _this = this;
        var _a;
        var author = message.author, channel = message.channel, guild = message.guild;
        if (guild && guild.me) {
            if (!guild.me.permissions.has('SEND_MESSAGES')) {
                var errorContent_1 = "I do not have permission to send messages on server \"" + guild.name + "\".";
                return rxjs_1.from(author.send(errorContent_1))
                    .pipe(operators_1.catchError(function (error) {
                    return rxjs_1.of(_this.onError(error, 'message.author.send', [errorContent_1]));
                }))
                    .subscribe();
            }
            if (guild.me &&
                channel.type === 'text' &&
                !((_a = channel.permissionsFor(guild.me)) === null || _a === void 0 ? void 0 : _a.has('SEND_MESSAGES'))) {
                var errorContent_2 = "I do not have permission to send messages on the \"" + channel.name + "\" channel on server \"" + guild.name + "\".";
                return rxjs_1.from(author.send(errorContent_2))
                    .pipe(operators_1.catchError(function (error) {
                    return rxjs_1.of(_this.onError(error, 'message.author.send', [errorContent_2]));
                }))
                    .subscribe();
            }
        }
        return rxjs_1.from(messageOptions ? channel.send(messageContent, messageOptions) : channel.send(messageContent))
            .pipe(operators_1.catchError(function (error) {
            return rxjs_1.of(_this.onError(error, 'message.channel.send', [messageContent, messageOptions]));
        }))
            .subscribe();
    };
    DiscordBot.prototype.sendError = function (message, error) {
        var errorMessage = error.message || error;
        this.sendMessage(message, undefined, {
            embed: {
                description: "**Error:** " + (errorMessage || 'My apologies. I had some trouble processing your request.'),
                color: 15158332,
            },
        });
    };
    DiscordBot.prototype.setActivityMessage = function (activityMessage, activityOptions) {
        var _this = this;
        return (this.client.user
            ? rxjs_1.from(this.client.user.setActivity(activityMessage, activityOptions))
            : rxjs_1.throwError('Client is missing'))
            .pipe(operators_1.catchError(function (error) {
            return rxjs_1.of(_this.onError(error, 'this.client.user.setActivity', [activityMessage, activityOptions]));
        }))
            .subscribe();
    };
    DiscordBot.prototype.onWrongParameterCount = function (message) {
        this.sendMessage(message, "Invalid parameter count.");
    };
    return DiscordBot;
}());
exports.DiscordBot = DiscordBot;
