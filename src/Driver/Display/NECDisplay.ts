import * as moment from 'moment-timezone';
import TimerWeekday from '@signageos/front-display/es6/NativeDevice/Timer/TimerWeekday';
import ITimer from '@signageos/front-display/es6/NativeDevice/Timer/ITimer';
import TimerType from '@signageos/front-display/es6/NativeDevice/Timer/TimerType';
import IDisplay, { VideoInput } from './IDisplay';
import DisplayCapability from './DisplayCapability';
import { INECAPI, ScheduleEvent, ISchedule, OSDOrientation } from '../../API/NECAPI';
import Orientation from '@signageos/front-display/es6/NativeDevice/Orientation';

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
			case DisplayCapability.CPU_FAN:
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

	public async getTimers(): Promise<ITimer[]> {
		const schedules = await this.necAPI.getSchedules();
		return this.convertSchedulesToTimers(schedules);
	}

	public async setTimer(type: TimerType, timeOn: string | null, timeOff: string | null, days: TimerWeekday[]): Promise<void> {
		const onIndex = this.getOnScheduleIndexFromTimerIndex(type);
		const offIndex = this.getOffScheduleIndexFromTimerIndex(type);
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

	public async openVideoInput(videoInput: VideoInput): Promise<void> {
		await this.necAPI.prepareQuickVideoInputSwitch(VideoInput.COMPUTE_MODULE, videoInput);
		await this.necAPI.switchVideoInput(videoInput);
	}

	public async closeVideoInput(): Promise<void> {
		await this.necAPI.switchVideoInput(VideoInput.COMPUTE_MODULE);
	}

	public async initCEC() {
		await this.necAPI.enableCEC();
		await this.necAPI.searchCECDevice();
	}

	public async resetSettings(): Promise<void> {
		await this.necAPI.setFactorySettings();
	}

	public async cpuFanOn(): Promise<void> {
		await this.necAPI.fanOn();
	}

	public async cpuFanOff(): Promise<void> {
		await this.necAPI.fanOff();
	}

	public async setOSDOrientation(orientation: Orientation): Promise<void> {
		const orientationKey = OSDOrientation[orientation] as keyof typeof OSDOrientation;
		let necOrientation = OSDOrientation[orientationKey];
		if (typeof necOrientation === 'undefined') {
			necOrientation = OSDOrientation.LANDSCAPE;
		}
		await this.necAPI.setOSDOrientation(necOrientation);
	}

	private getOnScheduleIndexFromTimerIndex(timerIndex: number) {
		return timerIndex * 2;
	}

	private getOffScheduleIndexFromTimerIndex(timerIndex: number) {
		return (timerIndex * 2) + 1;
	}

	private getTimerIndexFromScheduleIndex(scheduleIndex: number) {
		return Math.floor(scheduleIndex / 2);
	}

	private convertSchedulesToTimers(schedules: ISchedule[]): ITimer[] {
		const schedulesTimerTypeMap: { [timerType: number]: ISchedule[] } = {};
		for (let schedule of schedules) {
			const timerType = this.getTimerIndexFromScheduleIndex(schedule.index) as TimerType;
			if (!schedulesTimerTypeMap[timerType]) {
				schedulesTimerTypeMap[timerType] = [];
			}
			schedulesTimerTypeMap[timerType].push(schedule);
		}

		const timers: ITimer[] = [];
		for (let key of Object.keys(schedulesTimerTypeMap)) {
			const timerType = parseInt(key) as TimerType;
			const singleTimerSchedules = schedulesTimerTypeMap[timerType];
			const timer = this.combineSchedulesIntoTimer(timerType as TimerType, singleTimerSchedules);
			timers.push(timer);
		}
		return timers;
	}

	private combineSchedulesIntoTimer(timerType: TimerType, schedules: ISchedule[]): ITimer {
		if (schedules.length === 0) {
			throw new Error('Can\'t combine empty schedule list into a timer');
		}
		const MAX_VOLUME = 100;
		const weekdays = this.convertByteValueToDaysList(schedules[0].days);
		const timer: ITimer = {
			type: timerType,
			timeOn: null,
			timeOff: null,
			weekdays,
			volume: MAX_VOLUME,
		};
		for (let schedule of schedules) {
			switch (schedule.event) {
				case ScheduleEvent.ON:
					timer.timeOn = moment().hour(schedule.hour).minute(schedule.minute).second(0).format('HH:mm:ss');
					break;
				case ScheduleEvent.OFF:
					timer.timeOff = moment().hour(schedule.hour).minute(schedule.minute).second(0).format('HH:mm:ss');
					break;
				default:
					throw new Error('Schedule has invalid event type: ' + schedule.event);
			}
		}
		return timer;
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

	private convertByteValueToDaysList(daysByteValue: number): TimerWeekday[] {
		const DAY_VALUES: { [byteValue: number]: TimerWeekday } = {
			1: TimerWeekday.mon,
			2: TimerWeekday.tue,
			4: TimerWeekday.wed,
			8: TimerWeekday.thu,
			16: TimerWeekday.fri,
			32: TimerWeekday.sat,
			64: TimerWeekday.sun,
		};

		const days: TimerWeekday[] = [];
		for (let key of Object.keys(DAY_VALUES)) {
			const singleDayByteValue = parseInt(key);
			/* tslint:disable-next-line */// bitwise operation is not a typo, the days of the week are encoded as bits
			if (daysByteValue & singleDayByteValue) {
				const day = DAY_VALUES[singleDayByteValue];
				days.push(day);
			}
		}
		return days;
	}
}
