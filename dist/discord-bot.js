"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var discord_js_1 = __importDefault(require("discord.js"));
var rxjs_1 = require("rxjs");
var discord_bot_domain_1 = require("./discord-bot.domain");
var DiscordBot = /** @class */ (function () {
    function DiscordBot(discordBotSettings) {
        var _this = this;
        Object.assign(this, discordBotSettings);
        this.client = new discord_js_1.default.Client();
        this.client.login(this.botAuthToken).then(rxjs_1.noop, this.onError("client.login"));
        this.client.on('error', this.onError("client.on('error'"));
        this.client.on('ready', function () {
            _this.setActivityMessage();
            var guildIdentifications = [];
            _this.client.guilds.forEach(function (guild) {
                var leftGuild = _this.leaveGuildWhenSuspectedAsBotFarm(guild);
                if (!leftGuild) {
                    guildIdentifications.push(guild.id + " (\"" + guild.name + "\")");
                }
            });
            if (guildIdentifications.length) {
                _this.log("Currently running on the following " + guildIdentifications.length + " server(s):\n  " + guildIdentifications.sort().join('\n  '));
            }
        });
        this.client.on('guildCreate', function (guild) {
            _this.log("Joined guild \"" + guild.name + "\"");
            _this.onGuildUpdate(guild);
            discord_bot_domain_1.execute(_this.onGuildJoined, _this, guild);
        });
        this.client.on('guildMemberAdd', function (guild) { return _this.onGuildUpdate(guild); });
        this.client.on('guildMemberRemove', function (guild) { return _this.onGuildUpdate(guild); });
        this.client.on('guildDelete', function (guild) {
            _this.log("Left guild \"" + guild.name + "\"");
            discord_bot_domain_1.execute(_this.onGuildLeft, _this, guild);
        });
        this.client.on('message', function (message) {
            if (discord_bot_domain_1.messageContainsPrefix(message.content, _this.botPrefix) ||
                (_this.botPrefixDefault && discord_bot_domain_1.messageContainsPrefix(message.content, _this.botPrefixDefault))) {
                message.content.split('\n').forEach(function (line) {
                    if (discord_bot_domain_1.lineContainsPrefix(line, _this.botPrefix + " ")) {
                        var command = line.substring(_this.botPrefix.length + 1).split(' ')[0];
                        var parsedLine = line.substring(_this.botPrefix.length + 1 + command.length);
                        discord_bot_domain_1.execute(_this.botCommands[command], _this, message, line, discord_bot_domain_1.getParametersFromLine(parsedLine));
                    }
                    else if (_this.botCommands.default &&
                        _this.botPrefixDefault &&
                        discord_bot_domain_1.lineContainsPrefix(line, _this.botPrefixDefault)) {
                        _this.botCommands.default(_this, message, line, discord_bot_domain_1.getParametersFromLine(line));
                    }
                });
            }
            else if (message.isMentioned(_this.client.user)) {
                discord_bot_domain_1.execute(_this.onMention, _this, message);
            }
        });
    }
    DiscordBot.prototype.getClient = function () {
        return this.client;
    };
    DiscordBot.prototype.onGuildUpdate = function (guild) {
        this.leaveGuildWhenSuspectedAsBotFarm(guild);
        this.setActivityMessage();
    };
    DiscordBot.prototype.leaveGuildWhenSuspectedAsBotFarm = function (guild) {
        if (guild.members && this.minimumGuildMembersForFarmCheck && this.maximumGuildBotsPercentage) {
            var botCount_1 = 0;
            guild.members.forEach(function (member) {
                if (member.user.bot)
                    botCount_1++;
            });
            if (guild.members.size > this.minimumGuildMembersForFarmCheck &&
                (botCount_1 * 100) / guild.members.size >= this.maximumGuildBotsPercentage) {
                guild.leave().then(rxjs_1.noop, this.onError('guild.leave'));
                this.log("Server \"" + guild.name + "\" has been marked as potential bot farm");
                return true;
            }
        }
        return false;
    };
    DiscordBot.prototype.setActivityMessage = function () {
        var activityMessage = this.botPrefix + " help | " + this.client.guilds.size + " servers";
        var activityOptions = { type: 'LISTENING' };
        this.client.user
            .setActivity(activityMessage, activityOptions)
            .then(rxjs_1.noop, this.onError('client.user.setActivity', [activityMessage, JSON.stringify(activityOptions)]));
    };
    DiscordBot.prototype.onError = function (functionName, parameters) {
        var _this = this;
        return function (error) {
            var errorMessage = error + " thrown";
            if (functionName)
                errorMessage += " when calling " + functionName;
            if (parameters)
                errorMessage += " with parameters: " + parameters.join(', ');
            _this.error(errorMessage + ".");
        };
    };
    DiscordBot.prototype.log = function (message) {
        this.logger.info(message);
    };
    DiscordBot.prototype.error = function (error) {
        this.logger.error(error);
    };
    /* public */
    DiscordBot.prototype.onWrongParameterCount = function (message) {
        this.sendMessage(message, "Invalid parameter count.");
    };
    DiscordBot.prototype.sendMessage = function (message, messageContent, messageOptions) {
        var _this = this;
        if (message.guild.me.permissions.has('SEND_MESSAGES')) {
            message.channel.send(messageContent, messageOptions).then(rxjs_1.noop, function (error) {
                _this.onError(error, ['message.channel.send', messageContent, JSON.stringify(messageOptions)]);
            });
        }
        else {
            message.author.send("I don't have the permission to send messages on the server \"" + message.guild.name + "\". Please, contact the server admin to have this permission added.");
        }
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
    return DiscordBot;
}());
exports.DiscordBot = DiscordBot;
