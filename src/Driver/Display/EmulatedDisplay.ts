import IDisplay, { VideoInput } from './IDisplay';
import DisplayCapability from './DisplayCapability';
import { ISystemAPI } from '../../API/SystemAPI';
import ISystemSettings from '../../SystemSettings/ISystemSettings';
import ITimer from '@signageos/front-display/es6/NativeDevice/Timer/ITimer';
import TimerWeekday from '@signageos/front-display/es6/NativeDevice/Timer/TimerWeekday';

export default class EmulatedDisplay implements IDisplay {

	private isDisplayOn: boolean = true;

	constructor(private systemSettings: ISystemSettings, private systemAPI: ISystemAPI) {}

	public supports(_capability: DisplayCapability): boolean {
		return false;
	}

	public async isPowerOn(): Promise<boolean> {
		return this.isDisplayOn;
	}

	public async powerOff(): Promise<void> {
		await this.systemAPI.turnScreenOff();
		this.isDisplayOn = false;
	}

	public async powerOn(): Promise<void> {
		await this.systemAPI.turnScreenOn();
		this.isDisplayOn = true;
	}

	public async getBrightness(): Promise<number> {
		throw new Error('Not implemented');
	}

	public setBrightness(_brightness: number): Promise<void> {
		throw new Error('Not implemented');
	}

	public async getVolume(): Promise<number> {
		return await this.systemSettings.getVolume();
	}

	public async setVolume(volume: number): Promise<void> {
		await this.systemSettings.setVolume(volume);
	}

	public getTimers(): Promise<ITimer[]> {
		throw new Error('Not implemented');
	}

	public setTimer(_index: number, _timeOn: string | null, _timeOff: string | null, _days: TimerWeekday[]): Promise<void> {
		throw new Error('Not implemented');
	}

	public openVideoInput(_videoInput: VideoInput): Promise<void> {
		throw new Error('Not implemented');
	}

	public closeVideoInput(): Promise<void> {
		throw new Error('Not implemented');
	}

	public async initCEC(): Promise<void> {
		// do nothing
	}

	public async resetSettings(): Promise<void> {
		// do nothing
	}

	public cpuFanOn(): Promise<void> {
		throw new Error('Not implemented');
	}

	public cpuFanOff(): Promise<void> {
		throw new Error('Not implemented');
	}
}
