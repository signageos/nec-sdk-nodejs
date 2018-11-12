import Orientation from '@signageos/front-display/es6/NativeDevice/Orientation';
import { IVideoArguments } from './ServerVideo';

interface IServerVideo {
	getVideoArguments(): IVideoArguments | null;
	prepare(uri: string, x: number, y: number, width: number, height: number, orientation: Orientation, isStream: boolean): Promise<void>;
	play(): Promise<void>;
	stop(): Promise<void>;
	isIdle(): boolean;
	isPlaying(): boolean;
	isPaused(): boolean;
	addEventListener(event: string, callback: () => void): void;
	removeAllListeners(): void;
}

export default IServerVideo;
