export declare class UnexpectedReplyError extends Error {}
export declare class NullMessageReplyError extends Error {}
export class TimeoutError extends Error {}

export function asciiEncodeValue2Bytes (value: number): number[];
