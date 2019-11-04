import Orientation from '@signageos/front-display/es6/NativeDevice/Orientation';
import IVideoEvent from '@signageos/front-display/es6/Video/IVideoEvent';

interface IVideoPlayer {
	initialize(): Promise<void>;
	close(): Promise<void>;
	play(uri: string, x: number, y: number, width: number, height: number, orientation: Orientation, isStream: boolean): Promise<void>;
	stop(uri: string, x: number, y: number, width: number, height: number): Promise<void>;
	pause(uri: string, x: number, y: number, width: number, height: number): Promise<void>;
	resume(uri: string, x: number, y: number, width: number, height: number): Promise<void>;
	prepare(uri: string, x: number, y: number, width: number, height: number, orientation: Orientation, isStream: boolean): Promise<void>;
	addEventListener(event: 'ended', listener: (event: IVideoEvent) => void): void;
	addEventListener(event: 'error', listener: (event: IVideoEvent) => void): void;
	addEventListener(event: 'stopped', listener: (event: IVideoEvent) => void): void;
	removeEventListener(event: 'ended', listener: (event: IVideoEvent) => void): void;
	removeEventListener(event: 'error', listener: (event: IVideoEvent) => void): void;
	removeEventListener(event: 'stopped', listener: (event: IVideoEvent) => void): void;
	clearAll(): Promise<void>;
}

export default IVideoPlayer;
