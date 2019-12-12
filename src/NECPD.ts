import Opcode from './Opcode';
import NECSerialPort from './NECSerialPort';
import { PowerStatus } from './constants';
import { ISchedule } from './facade';

export default class NECPD {

	private readonly necSerialPort: NECSerialPort;

	constructor() {
		this.necSerialPort = new NECSerialPort();
	}

	public async isAlive(): Promise<boolean> {
		try {
			await this.getMonitorId();
			return true;
		} catch (error) {
			return false;
		}
	}

	public async getMaxValue(opcode: Opcode): Promise<number> {
		const { maxValue } = await this.getOrSetParameter(opcode);
		return maxValue;
	}

	public async getParameter(opcode: Opcode): Promise<number> {
		const { currentValue } = await this.getOrSetParameter(opcode);
		return currentValue;
	}

	public async setParameter(opcode: Opcode, value: number) {
		const { result, currentValue } = await this.getOrSetParameter(opcode, value);
		if (result > 0 || currentValue !== value) {
			throw new Error('failed to set parameter');
		}
	}

	public async getPowerStatus() {
		const monitorId = await this.getMonitorId();
		return await this.necSerialPort.getPowerStatus(monitorId);
	}

	public async setPowerStatus(powerStatus: PowerStatus) {
		const monitorId = await this.getMonitorId();
		return await this.necSerialPort.setPowerStatus(monitorId, powerStatus);
	}

	public async getSchedule(index: number) {
		const monitorId = await this.getMonitorId();
		return await this.necSerialPort.getSchedule(monitorId, index);
	}

	public async setSchedule(schedule: ISchedule) {
		const monitorId = await this.getMonitorId();
		return await this.necSerialPort.setSchedule(monitorId, schedule);
	}

	public async disableSchedule(index: number) {
		const monitorId = await this.getMonitorId();
		return await this.necSerialPort.disableSchedule(monitorId, index);
	}

	public async lockComputeModuleSettings() {
		const monitorId = await this.getMonitorId();
		return await this.necSerialPort.lockComputeModuleSettings(monitorId);
	}

	public async unlockComputeModuleSettings() {
		const monitorId = await this.getMonitorId();
		return await this.necSerialPort.unlockComputeModuleSettings(monitorId);
	}

	public async getDisplayTime() {
		const monitorId = await this.getMonitorId();
		return await this.necSerialPort.getDateAndTime(monitorId);
	}

	public async setDisplayTimeFromSystem() {
		const monitorId = await this.getMonitorId();
		const now = new Date();
		return await this.necSerialPort.setDateAndTime(monitorId, now);
	}

	public async getModelName() {
		const monitorId = await this.getMonitorId();
		return await this.necSerialPort.getModelName(monitorId);
	}

	public async getSerialNumber() {
		const monitorId = await this.getMonitorId();
		return await this.necSerialPort.getSerialNumber(monitorId);
	}

	public async getFirmwareVersion() {
		const monitorId = await this.getMonitorId();
		return await this.necSerialPort.getFirmwareVersion(monitorId);
	}

	public async cecSearchDevice() {
		const monitorId = await this.getMonitorId();
		await this.necSerialPort.cecSearchDevice(monitorId);
	}

	private async getOrSetParameter(opcode: Opcode, value?: number) {
		const monitorId = await this.getMonitorId();
		return await this.necSerialPort.getOrSetParameter(monitorId, opcode, value);
	}

	private async getMonitorId(): Promise<number> {
		const { currentValue } = await this.necSerialPort.getOrSetParameter('all', Opcode.MONITOR_ID);
		return currentValue;
	}
}
