import { execApiCommand } from './apiCommand';
import { locked } from '@signageos/front-display/es6/Lock/lockedDecorator';

export enum ScheduleEvent {
	ON = 1,
	OFF = 2,
}

export interface ISchedule {
	index: number;
	event: ScheduleEvent;
	hour: number;
	minute: number;
	days: number;
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
	getSchedules(): Promise<ISchedule[]>;
	setSchedule(index: number, event: ScheduleEvent, hour: number, minute: number, days: number): Promise<void>;
	disableSchedule(index: number): Promise<void>;
	setDisplayTimeFromSystemTime(): Promise<void>;
}

export class NECAPI implements INECAPI {

	@locked('necapi')
	public async isNEC() {
		const result = await execNECDisplayCommand('misc', 'is_nec');
		return result === '1';
	}

	@locked('necapi')
	public async isDisplayOn() {
		const result = await execNECDisplayCommand('power', 'get');
		return result === '1';
	}

	@locked('necapi')
	public async powerOff() {
		await execNECDisplayCommand('power', 'standby');
	}

	@locked('necapi')
	public async powerOn() {
		await execNECDisplayCommand('power', 'on');
	}

	@locked('necapi')
	public async getBrightness() {
		const result = await execNECDisplayCommand('brightness', 'get');
		return parseInt(result);
	}

	@locked('necapi')
	public async setBrightness(brightness: number) {
		await execNECDisplayCommand('brightness', 'set', [brightness.toString()]);
	}

	@locked('necapi')
	public async getVolume() {
		const result = await execNECDisplayCommand('volume', 'get');
		return parseInt(result);
	}

	@locked('necapi')
	public async setVolume(volume: number) {
		await execNECDisplayCommand('volume', 'set', [volume.toString()]);
	}

	@locked('necapi')
	public async getSchedules() {
		const result = await execNECDisplayCommand('schedules', 'get_list');
		return parseGetSchedulesOutput(result);
	}

	@locked('necapi')
	public async setSchedule(index: number, event: ScheduleEvent, hour: number, minute: number, days: number) {
		await execNECDisplayCommand('schedules', 'set', [
			index.toString(),
			event.toString(),
			hour.toString(),
			minute.toString(),
			days.toString(),
		]);
	}

	@locked('necapi')
	public async disableSchedule(index: number) {
		await execNECDisplayCommand('schedules', 'disable', [index.toString()]);
	}

	@locked('necapi')
	public async setDisplayTimeFromSystemTime() {
		await execNECDisplayCommand('time', 'set_from_system_to_display');
	}
}

export function parseGetSchedulesOutput(rawOutput: string): ISchedule[] {
	const schedules: ISchedule[] = [];
	if (rawOutput) {
		for (let line of rawOutput.split("\n")) {
			const [index, event, hour, minute, days] = line.split(',');
			if (!index || !event || !hour || !minute || !days) {
				throw new Error(`Invalid output of getSchedules: index=${index}, event=${event}, hour=${hour}, minute=${minute}, days=${days}`);
			}
			const schedule: ISchedule = {
				index: parseInt(index),
				event: parseInt(event),
				hour: parseInt(hour),
				minute: parseInt(minute),
				days: parseInt(days),
			};
			schedules.push(schedule);
		}
	}
	return schedules;
}

async function execNECDisplayCommand(category: string, command: string, args: string[] = []) {
	const result = await execApiCommand('nec', 'display', [category, command, ...args], { asRoot: true });
	return result.trim();
}
