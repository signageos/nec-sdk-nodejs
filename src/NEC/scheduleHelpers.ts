import * as moment from 'moment-timezone';
import { ISchedule } from '@signageos/nec-sdk/dist/facade';
import { ScheduleEvent, VideoInput, ScheduleType } from '@signageos/nec-sdk/dist/constants';
import ITimer from '@signageos/front-display/es6/NativeDevice/Timer/ITimer';
import TimerType from '@signageos/front-display/es6/NativeDevice/Timer/TimerType';
import TimerWeekday from '@signageos/front-display/es6/NativeDevice/Timer/TimerWeekday';

export function createSchedule(index: number, event: ScheduleEvent, hour: number, minute: number, week: number): ISchedule {
	return {
		index,
		event,
		hour,
		minute,
		input: VideoInput.COMPUTE_MODULE,
		week,
		type: ScheduleType.SPECIFIC_DAYS,
		pictureMode: 0,
		year: 0,
		month: 0,
		day: 0,
		order: 0,
		extension1: 0,
		extension2: 0,
		extension3: 0,
	};
}

export function isScheduleEnabled(schedule: ISchedule): boolean {
	return schedule.type === ScheduleType.SPECIFIC_DAYS;
}

export function getOnScheduleIndexFromTimerIndex(timerIndex: number) {
	return timerIndex * 2;
}

export function getOffScheduleIndexFromTimerIndex(timerIndex: number) {
	return (timerIndex * 2) + 1;
}

export function convertDaysListToByteValue(days: TimerWeekday[]) {
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

export function convertSchedulesToTimers(schedules: ISchedule[]): ITimer[] {
	const schedulesTimerTypeMap: { [timerType: number]: ISchedule[] } = {};
	for (let schedule of schedules) {
		const timerType = getTimerIndexFromScheduleIndex(schedule.index) as TimerType;
		if (!schedulesTimerTypeMap[timerType]) {
			schedulesTimerTypeMap[timerType] = [];
		}
		schedulesTimerTypeMap[timerType].push(schedule);
	}

	const timers: ITimer[] = [];
	for (let key of Object.keys(schedulesTimerTypeMap)) {
		const timerType = parseInt(key) as TimerType;
		const singleTimerSchedules = schedulesTimerTypeMap[timerType];
		const timer = combineSchedulesIntoTimer(timerType as TimerType, singleTimerSchedules);
		timers.push(timer);
	}
	return timers;
}

function getTimerIndexFromScheduleIndex(scheduleIndex: number) {
	return Math.floor(scheduleIndex / 2);
}

function combineSchedulesIntoTimer(timerType: TimerType, schedules: ISchedule[]): ITimer {
	if (schedules.length === 0) {
		throw new Error('Can\'t combine empty schedule list into a timer');
	}
	const MAX_VOLUME = 100;
	const weekdays = convertByteValueToDaysList(schedules[0].week);
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

function convertByteValueToDaysList(daysByteValue: number): TimerWeekday[] {
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
