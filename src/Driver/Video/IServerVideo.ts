import IVideoEvent from '@signageos/front-display/es6/Video/IVideoEvent';
import { IVideoArguments } from './ServerVideo';
import { IOptions } from '@signageos/front-display/es6/Video/IVideoPlayer';

interface IServerVideo {
	getVideoArguments(): IVideoArguments | null;
	initialize(): Promise<void>;
	close(): Promise<void>;
	prepare(
		uri: string,
		x: number,
		y: number,
		width: number,
		height: number,
		isStream: boolean,
		options?: IOptions,
	): Promise<void>;
	play(): Promise<void>;
	pause(): Promise<void>;
	resume(): Promise<void>;
	stop(): Promise<void>;
	isIdle(): boolean;
	isPlaying(): boolean;
	addEventListener(eventName: string, listener: (event: IVideoEvent) => void): void;
	waitUntilIdle(): Promise<void>;
}

export default IServerVideo;
