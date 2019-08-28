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
	prepareQuickVideoInputSwitch(input1: string, input2: string): Promise<void>;
	switchVideoInput(input1: string): Promise<void>;
	isHumanDetected(): Promise<boolean>;
	searchCECDevice(): Promise<void>;
	setFactorySettings(): Promise<void>;
}

export class NECAPI implements INECAPI {

	private isNECCached: boolean | null = null;

	@locked('necapi')
	public async isNEC() {
		if (this.isNECCached === null) {
			const result = await execNECDisplayCommand('misc', 'is_nec');
			this.isNECCached = result === '1';
		}
		return this.isNECCached;
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

	@locked('necapi')
	public async prepareQuickVideoInputSwitch(input1: string, input2: string): Promise<void> {
		await execNECDisplayCommand('video_input', 'prepare_quick_switch', [input1, input2]);
	}

	@locked('necapi')
	public async switchVideoInput(input: string): Promise<void> {
		await execNECDisplayCommand('video_input', 'switch_input', [input]);
	}

	@locked('necapi')
	public async isHumanDetected(): Promise<boolean> {
		const result = await execNECDisplayCommand('human_sensing', 'is_human_detected');
		return result === '1';
	}

	@locked('necapi')
	public async searchCECDevice() {
		await execNECDisplayCommand('cec', 'search_device');
	}

	@locked('necapi')
	public async setFactorySettings(): Promise<void> {
		await execNECDisplayCommand('settings', 'factory');
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
