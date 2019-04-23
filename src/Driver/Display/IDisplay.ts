import TimerWeekday from '@signageos/front-display/es6/NativeDevice/Timer/TimerWeekday';
import DisplayCapability from './DisplayCapability';

interface IDisplay {
	supports(capability: DisplayCapability): boolean;
	isPowerOn(): Promise<boolean>;
	powerOff(): Promise<void>;
	powerOn(): Promise<void>;
	getBrightness(): Promise<number>;
	setBrightness(brightness: number): Promise<void>;
	getVolume(): Promise<number>;
	setVolume(volume: number): Promise<void>;
	setShedule(index: number, timeOn: string | null, timeOff: string | null, days: TimerWeekday[]): Promise<void>;
}

export default IDisplay;
