/**
 * Extract parameters from line.
 * @param line Line without prefix nor command.
 */
export declare const getParametersFromLine: (line: string) => string[];
/**
 * Check whether a message line contains the passed prefix.
 * @param message Message to check.
 * @param prefix Prefic to check for.
 */
export declare const messageContainsPrefix: (message: string, prefix: string) => boolean;
/**
 * Check whether a single line contains the passed prefix.
 * @param line Line to check.
 * @param prefix Prefic to check for.
 */
export declare const lineContainsPrefix: (line: string, prefix: string) => boolean;
/**
 * Executes the method passed, if set and of type function, with the passed params as arguments.
 * @param method Method to call (optional).
 * @param params Params to send to the method (optional).
 */
export declare const execute: (method: Function | undefined, ...params: any) => any;
