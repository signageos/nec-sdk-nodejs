import * as SerialPort from 'serialport';
import { locked } from './lockedDecorator';
import { UnexpectedReplyError, NullMessageReplyError, TimeoutError } from './protocol';
import {
	IGetOrSetParameterResponse,
	ISchedule,
	convertMonitorIdToAddress,
	getOrSetParameter,
	getPowerStatus,
	setPowerStatus,
	getSchedule,
	setSchedule,
	enableDisableSchedule,
	setComputeModuleSettingsLock,
	getDateAndTime,
	setDateAndTime,
	getModelName,
	getSerialNumber,
	getFirmwareVersion,
} from './facade';
import NECParser from './NECParser';
import Opcode from './Opcode';
import {
	PowerStatus,
	ScheduleEnabledStatus,
	ComputeModuleLockMode,
	COMPUTE_MODULE_DEFAULT_SETTINGS_PASSWORD,
	FirmwareType,
	CECSearchDevice,
} from './constants';

function wait(timeout: number) {
	return new Promise<void>((resolve: () => void) => {
		setTimeout(resolve, timeout);
	});
}

export default class NECSerialPort {

	constructor(private serialPort: string) {}

	public async getOrSetParameter(monitorId: string | number, opcode: Opcode, value?: number): Promise<IGetOrSetParameterResponse> {
		return await this.sendRetriableRequest(async (serialPort: SerialPort, getReply: () => Promise<number[]>) => {
			const address = convertMonitorIdToAddress(monitorId);
			return await getOrSetParameter(serialPort, address, getReply, opcode, value);
		});
	}

	public async getPowerStatus(monitorId: string | number): Promise<PowerStatus> {
		return await this.sendRetriableRequest(async (serialPort: SerialPort, getReply: () => Promise<number[]>) => {
			const address = convertMonitorIdToAddress(monitorId);
			return await getPowerStatus(serialPort, address, getReply);
		});
	}

	public async setPowerStatus(monitorId: string | number, powerStatus: PowerStatus): Promise<void> {
		return await this.sendRetriableRequest(async (serialPort: SerialPort, getReply: () => Promise<number[]>) => {
			const address = convertMonitorIdToAddress(monitorId);
			await setPowerStatus(serialPort, address, getReply, powerStatus);
		});
	}

	public async getSchedule(monitorId: string | number, index: number): Promise<ISchedule> {
		return await this.sendRetriableRequest(async (serialPort: SerialPort, getReply: () => Promise<number[]>) => {
			const address = convertMonitorIdToAddress(monitorId);
			return await getSchedule(serialPort, address, getReply, index);
		});
	}

	public async setSchedule(monitorId: string | number, schedule: ISchedule): Promise<void> {
		return await this.sendRetriableRequest(async (serialPort: SerialPort, getReply: () => Promise<number[]>) => {
			const address = convertMonitorIdToAddress(monitorId);
			await setSchedule(serialPort, address, getReply, schedule);
		});
	}

	public async enableSchedule(monitorId: string | number, index: number): Promise<void> {
		return await this.sendRetriableRequest(async (serialPort: SerialPort, getReply: () => Promise<number[]>) => {
			const address = convertMonitorIdToAddress(monitorId);
			await enableDisableSchedule(serialPort, address, getReply, index, ScheduleEnabledStatus.ENABLED);
		});
	}

	public async disableSchedule(monitorId: string | number, index: number): Promise<void> {
		return await this.sendRetriableRequest(async (serialPort: SerialPort, getReply: () => Promise<number[]>) => {
			const address = convertMonitorIdToAddress(monitorId);
			await enableDisableSchedule(serialPort, address, getReply, index, ScheduleEnabledStatus.DISABLED);
		});
	}

	public async lockComputeModuleSettings(monitorId: string | number): Promise<void> {
		return await this.sendRetriableRequest(async (serialPort: SerialPort, getReply: () => Promise<number[]>) => {
			const address = convertMonitorIdToAddress(monitorId);
			await setComputeModuleSettingsLock(
				serialPort,
				address,
				getReply,
				ComputeModuleLockMode.LOCKED,
				COMPUTE_MODULE_DEFAULT_SETTINGS_PASSWORD,
			);
		});
	}

	public async unlockComputeModuleSettings(monitorId: string | number): Promise<void> {
		return await this.sendRetriableRequest(async (serialPort: SerialPort, getReply: () => Promise<number[]>) => {
			const address = convertMonitorIdToAddress(monitorId);
			await setComputeModuleSettingsLock(
				serialPort,
				address,
				getReply,
				ComputeModuleLockMode.UNLOCKED,
				COMPUTE_MODULE_DEFAULT_SETTINGS_PASSWORD,
			);
		});
	}

	public async getDateAndTime(monitorId: string | number): Promise<Date> {
		return await this.sendRetriableRequest(async (serialPort: SerialPort, getReply: () => Promise<number[]>) => {
			const address = convertMonitorIdToAddress(monitorId);
			return await getDateAndTime(serialPort, address, getReply);
		});
	}

	public async setDateAndTime(monitorId: string | number, datetime: Date): Promise<void> {
		return await this.sendRetriableRequest(async (serialPort: SerialPort, getReply: () => Promise<number[]>) => {
			const address = convertMonitorIdToAddress(monitorId);
			await setDateAndTime(serialPort, address, getReply, datetime);
		});
	}

	public async getModelName(monitorId: string | number): Promise<string> {
		return await this.sendRetriableRequest(async (serialPort: SerialPort, getReply: () => Promise<number[]>) => {
			const address = convertMonitorIdToAddress(monitorId);
			return await getModelName(serialPort, address, getReply);
		});
	}

	public async getSerialNumber(monitorId: string | number): Promise<string> {
		return await this.sendRetriableRequest(async (serialPort: SerialPort, getReply: () => Promise<number[]>) => {
			const address = convertMonitorIdToAddress(monitorId);
			return await getSerialNumber(serialPort, address, getReply);
		});
	}

	public async getFirmwareVersion(monitorId: string | number): Promise<string> {
		return await this.sendRetriableRequest(async (serialPort: SerialPort, getReply: () => Promise<number[]>) => {
			const address = convertMonitorIdToAddress(monitorId);
			return await getFirmwareVersion(serialPort, address, getReply, FirmwareType.TYPE0);
		});
	}

	public async cecSearchDevice(monitorId: string | number): Promise<void> {
		await this.getOrSetParameter(monitorId, Opcode.CEC_SEARCH_DEVICE, CECSearchDevice.YES);
		await wait(15e3);
	}

	@locked('necapi')
	private async sendRetriableRequest<T>(callback: (serialPort: SerialPort, getReply: () => Promise<number[]>) => Promise<T>) {
		return await this.retry(async () => {
			return await this.sendRequest(callback);
		});
	}

	private async retry(callback: () => Promise<any>) {
		try {
			return await callback();
		} catch (error) {
			if (error instanceof UnexpectedReplyError ||
				error instanceof NullMessageReplyError ||
				error instanceof TimeoutError
			) {
				await wait(1e3);
				return await callback();
			} else {
				throw error;
			}
		}
	}

	private async sendRequest<T>(callback: (serialPort: SerialPort, getReply: () => Promise<number[]>) => Promise<T>) {
		const serialPort = new SerialPort(this.serialPort, { baudRate: 9600, autoOpen: false });
		try {
			return await Promise.race([
				new Promise((resolve: (result: T) => void, reject: (error: Error) => void) => {
					serialPort.open((error?: Error) => {
						if (error) {
							reject(error);
						} else {
							const parser = serialPort.pipe(new NECParser());
							callback(serialPort, this.createGetReplyCallback(parser)).then(resolve, reject);
						}
					});
				}),
				new Promise((_resolve: (result: T) => void, reject: (error: Error) => void) => {
					setTimeout(() => reject(new TimeoutError('timeout')), 7e3);
				}),
			]);
		} finally {
			serialPort.close();
		}
	}

	private createGetReplyCallback(parser: NECParser): () => Promise<number[]> {
		return () => new Promise((resolve: (data: number[]) => void, reject: (error: Error) => void) => {
			parser.once('data', resolve);
			parser.once('error', reject);
		});
	}
}
