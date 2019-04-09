import { execApiCommand } from './apiCommand';

export enum ScheduleEvent {
	ON = 1,
	OFF = 2,
}

export interface INECAPI {
	isNEC(): Promise<boolean>;
	isDisplayOn(): Promise<boolean>;
	powerOn(): Promise<void>;
	powerOff(): Promise<void>;
	getBrightness(): Promise<number>;
	setBrightness(brightness: number): Promise<void>;
	getVolume(): Promise<number>;
	setVolume(volume: number): Promise<void>;
	setSchedule(index: number, event: ScheduleEvent, hour: number, minute: number, days: number): Promise<void>;
	disableSchedule(index: number): Promise<void>;
	setDisplayTimeFromSystemTime(): Promise<void>;
}

export function createNECAPI(): INECAPI {
	return {
		async isNEC() {
			const result = await execApiCommand('nec', 'is_nec');
			const resultTrimmed = result.trim();
			return resultTrimmed === '1';
		},

		async isDisplayOn() {
			const result = await execApiCommand('nec', 'get_power_status');
			const resultTrimmed = result.trim();
			return resultTrimmed === '1';
		},

		async powerOff() {
			await execApiCommand('nec', 'set_power_standby');
		},

		async powerOn() {
			await execApiCommand('nec', 'set_power_on');
		},

		async getBrightness() {
			const result = await execApiCommand('nec', 'get_brightness');
			return parseInt(result.trim());
		},

		async setBrightness(brightness: number) {
			await execApiCommand('nec', 'set_brightness', [brightness.toString()]);
		},

		async getVolume() {
			const result = await execApiCommand('nec', 'get_volume');
			return parseInt(result.trim());
		},

		async setVolume(volume: number) {
			await execApiCommand('nec', 'set_volume', [volume.toString()]);
		},

		async setSchedule(index: number, event: ScheduleEvent, hour: number, minute: number, days: number) {
			await execApiCommand('nec', 'set_schedule', [
				index.toString(),
				event.toString(),
				hour.toString(),
				minute.toString(),
				days.toString(),
			]);
		},

		async disableSchedule(index: number) {
			await execApiCommand('nec', 'disable_schedule', [index.toString()]);
		},

		async setDisplayTimeFromSystemTime() {
			await execApiCommand('nec', 'refresh_display_time');
		},
	};
}
