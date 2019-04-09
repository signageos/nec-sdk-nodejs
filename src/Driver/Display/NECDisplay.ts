import * as moment from 'moment-timezone';
import TimerWeekday from '@signageos/front-display/es6/NativeDevice/Timer/TimerWeekday';
import IDisplay from './IDisplay';
import DisplayCapability from './DisplayCapability';
import { INECAPI, ScheduleEvent } from '../../API/NECAPI';

const REFRESH_DISPLAY_TIME_INTERVAL = 5 * 60e3; // 5 minutes

export default class NECDisplay implements IDisplay {

	constructor(private necAPI: INECAPI) {
		setInterval(
			() => this.necAPI.setDisplayTimeFromSystemTime(),
			REFRESH_DISPLAY_TIME_INTERVAL,
		);
	}

	public supports(capability: DisplayCapability): boolean {
		switch (capability) {
			case DisplayCapability.BRIGHTNESS:
			case DisplayCapability.SCHEDULE:
				return true;

			default:
				return false;
		}
	}

	public isPowerOn(): Promise<boolean> {
		return this.necAPI.isDisplayOn();
	}

	public powerOff(): Promise<void> {
		return this.necAPI.powerOff();
	}

	public powerOn(): Promise<void> {
		return this.necAPI.powerOn();
	}

	public getBrightness(): Promise<number> {
		return this.necAPI.getBrightness();
	}

	public setBrightness(brightness: number): Promise<void> {
		return this.necAPI.setBrightness(brightness);
	}

	public getVolume(): Promise<number> {
		return this.necAPI.getVolume();
	}

	public setVolume(volume: number): Promise<void> {
		return this.necAPI.setVolume(volume);
	}

	public async setShedule(index: number, timeOn: string | null, timeOff: string | null, days: TimerWeekday[]): Promise<void> {
		const onIndex = this.getOnScheduleIndexFromTimerIndex(index);
		const offIndex = this.getOffScheduleIndexFromTimerIndex(index);
		const daysByteValue = this.convertDaysListToByteValue(days);

		if (timeOn) {
			const onMoment = moment(timeOn!, 'HH:mm:ss');
			const onHour = onMoment.hour();
			const onMinute = onMoment.minute();
			await this.necAPI.setSchedule(onIndex, ScheduleEvent.ON, onHour, onMinute, daysByteValue);
		} else {
			await this.necAPI.disableSchedule(onIndex);
		}

		if (timeOff) {
			const offMoment = moment(timeOff!, 'HH:mm:ss');
			const offHour = offMoment.hour();
			const offMinute = offMoment.minute();
			await this.necAPI.setSchedule(offIndex, ScheduleEvent.OFF, offHour, offMinute, daysByteValue);
		} else {
			await this.necAPI.disableSchedule(offIndex);
		}
	}

	private convertDaysListToByteValue(days: TimerWeekday[]) {
		const DAY_VALUES = {
			[TimerWeekday.mon]: 1,
			[TimerWeekday.tue]: 2,
			[TimerWeekday.wed]: 4,
			[TimerWeekday.thu]: 8,
			[TimerWeekday.fri]: 16,
			[TimerWeekday.sat]: 32,
			[TimerWeekday.sun]: 64,
		};
		return days.reduce((total: number, day: TimerWeekday) => total + DAY_VALUES[day], 0);
	}

	private getOnScheduleIndexFromTimerIndex(timerIndex: number) {
		return timerIndex * 2;
	}

	private getOffScheduleIndexFromTimerIndex(timerIndex: number) {
		return (timerIndex * 2) + 1;
	}
}
