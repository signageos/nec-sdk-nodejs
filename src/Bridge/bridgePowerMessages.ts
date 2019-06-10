import TimerType from "@signageos/front-display/es6/NativeDevice/Timer/TimerType";
import TimerWeekday from "@signageos/front-display/es6/NativeDevice/Timer/TimerWeekday";

export const AppRestart = 'Power.AppRestart';
export interface AppRestart {
	type: typeof AppRestart;
}

export const SystemReboot = 'Power.SystemRestart';
export interface SystemReboot {
	type: typeof SystemReboot;
}

export const SetTimer = 'Power.SetTimer';
export interface SetTimer {
	type: typeof SetTimer;
	timerType: TimerType;
	timeOn: string | null;
	timeOff: string | null;
	weekdays: TimerWeekday[];
	volume: number;
}
