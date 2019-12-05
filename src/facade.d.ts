import * as SerialPort from 'serialport';
import {
	PowerStatus,
	ScheduleEvent,
	VideoInput,
	ScheduleType,
	ScheduleEnabledStatus,
	ComputeModuleLockMode,
	FirmwareType,
} from './constants';

export declare function convertMonitorIdToAddress(monitorId: string | number): number;

export interface IGetOrSetParameterResponse {
	result: number;
	opcode: number;
	type: number;
	maxValue: number;
	currentValue: number;
}

export declare function getOrSetParameter(
	port: SerialPort,
	address: number,
	getReply: () => Promise<number[]>,
	opcode: number,
	value?: number,
): Promise<IGetOrSetParameterResponse>;

export declare function getPowerStatus(
	port: SerialPort,
	address: number,
	getReply: () => Promise<number[]>,
): Promise<PowerStatus>;

export declare function setPowerStatus(
	port: SerialPort,
	address: number,
	getReply: () => Promise<number[]>,
	powerStatus: PowerStatus,
): Promise<void>;

export interface ISchedule {
	index: number;
	event: ScheduleEvent;
	hour: number;
	minute: number;
	input: VideoInput;
	week: number;
	type: ScheduleType;
	pictureMode: number;
	year: number;
	month: number;
	day: number;
	order: number;
	extension1: number;
	extension2: number;
	extension3: number;
}

export declare function getSchedule(
	port: SerialPort,
	address: number,
	getReply: () => Promise<number[]>,
	index: number,
): Promise<ISchedule>;

export declare function setSchedule(
	port: SerialPort,
	address: number,
	getReply: () => Promise<number[]>,
	schedule: ISchedule,
): Promise<void>;

export declare function enableDisableSchedule(
	port: SerialPort,
	address: number,
	getReply: () => Promise<number[]>,
	index: number,
	enableDisable: ScheduleEnabledStatus,
): Promise<void>;

export declare function setComputeModuleSettingsLock(
	port: SerialPort,
	address: number,
	getReply: () => Promise<number[]>,
	secureMode: ComputeModuleLockMode,
	password: string,
): Promise<void>;

export declare function setDateAndTime(
	port: SerialPort,
	address: number,
	getReply: () => Promise<number[]>,
	date: Date,
): Promise<void>;

export function getModelName(
	port: SerialPort,
	address: number,
	getReply: () => Promise<number[]>,
): Promise<string>;

export function getSerialNumber(
	port: SerialPort,
	address: number,
	getReply: () => Promise<number[]>,
): Promise<string>;

export function getFirmwareVersion(
	port: SerialPort,
	address: number,
	getReply: () => Promise<number[]>,
	firmwareType: FirmwareType,
): Promise<string>;
