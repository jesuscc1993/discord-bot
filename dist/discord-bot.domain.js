"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = exports.lineContainsPrefix = exports.messageContainsPrefix = exports.getParametersFromLine = void 0;
/**
 * Extract parameters from line.
 * @param line Line without prefix nor command.
 */
exports.getParametersFromLine = function (line) {
    return line.split(' ').slice(1);
};
/**
 * Check whether a message line contains the passed prefix.
 * @param message Message to check.
 * @param prefix Prefic to check for.
 */
exports.messageContainsPrefix = function (message, prefix) {
    return message.indexOf(prefix) === 0 || message.includes("\n" + prefix);
};
/**
 * Check whether a single line contains the passed prefix.
 * @param line Line to check.
 * @param prefix Prefic to check for.
 */
exports.lineContainsPrefix = function (line, prefix) {
    return line.indexOf(prefix) === 0 && line.substring(prefix.length + 1).charAt(0) !== ' ';
};
/**
 * Executes the method passed, if set and of type function, with the passed params as arguments.
 * @param method Method to call (optional).
 * @param params Params to send to the method (optional).
 */
exports.execute = function (method) {
    var params = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        params[_i - 1] = arguments[_i];
    }
    if (typeof method !== 'function')
        return;
    return method.apply(void 0, params);
};
