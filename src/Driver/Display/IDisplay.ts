import TimerWeekday from '@signageos/front-display/es6/NativeDevice/Timer/TimerWeekday';
import DisplayCapability from './DisplayCapability';
import ITimer from '@signageos/front-display/es6/NativeDevice/Timer/ITimer';
import TimerType from '@signageos/front-display/es6/NativeDevice/Timer/TimerType';
import Orientation from '@signageos/front-display/es6/NativeDevice/Orientation';

export enum VideoInput {
	HDMI1 = 'HDMI1',
	HDMI2 = 'HDMI2',
	HDMI3 = 'HDMI3',
	HDMI4 = 'HDMI4',
	DVI = 'DVI',
	DP = 'DP',
	COMPUTE_MODULE = 'COMPUTE_MODULE',
}

interface IDisplay {
	supports(capability: DisplayCapability): boolean;
	isPowerOn(): Promise<boolean>;
	powerOff(): Promise<void>;
	powerOn(): Promise<void>;
	getBrightness(): Promise<number>;
	setBrightness(brightness: number): Promise<void>;
	getVolume(): Promise<number>;
	setVolume(volume: number): Promise<void>;
	getTimers(): Promise<ITimer[]>;
	setTimer(type: TimerType, timeOn: string | null, timeOff: string | null, weekdays: TimerWeekday[]): Promise<void>;
	openVideoInput(videoInput: VideoInput): Promise<void>;
	closeVideoInput(): Promise<void>;
	initCEC(): Promise<void>;
	resetSettings(): Promise<void>;
	cpuFanOn(): Promise<void>;
	cpuFanOff(): Promise<void>;
	setOSDOrientation(orientation: Orientation): Promise<void>;
	syncDatetimeWithSystem(): Promise<void>;
}

export default IDisplay;
