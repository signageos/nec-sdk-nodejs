import Orientation from '@signageos/front-display/es6/NativeDevice/Orientation';
import VideoOrientation from '@signageos/front-display/es6/Video/Orientation';

export default interface ISystemSettings {
	getVolume(): Promise<number>;
	setVolume(volume: number): Promise<void>;
	getScreenOrientation(): Promise<Orientation>;
	getVideoOrientation(): Promise<VideoOrientation | null>;
	setScreenOrientation(orientation: Orientation, videoOrientation?: VideoOrientation): Promise<void>;
}
