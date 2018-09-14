import IVideo from '@signageos/front-display/es6/Video/IVideo';
import Orientation from '@signageos/front-display/es6/NativeDevice/Orientation';

interface IVideoPlayer {
	play(uri: string, x: number, y: number, width: number, height: number, orientation: Orientation): Promise<IVideo>;
	stop(uri: string, x: number, y: number, width: number, height: number): Promise<void>;
	pause(uri: string, x: number, y: number, width: number, height: number): Promise<void>;
	resume(uri: string, x: number, y: number, width: number, height: number): Promise<void>;
	prepare(uri: string, x: number, y: number, width: number, height: number): Promise<void>;
	clearAll(): Promise<void>;
}

export default IVideoPlayer;
