import Opcode from './Opcode';
import NECSerialPort from './NECSerialPort';
import { PowerStatus } from './constants';
import { ISchedule } from './facade';

export default class NECPD {

	private readonly necSerialPort: NECSerialPort;

	constructor() {
		this.necSerialPort = new NECSerialPort();
	}

	public async getMaxValue(opcode: Opcode): Promise<number> {
		console.log('nec getMaxValue', opcode);
		const { maxValue } = await this.getOrSetParameter(opcode);
		return maxValue;
	}

	public async getParameter(opcode: Opcode): Promise<number> {
		console.log('nec getParameter', opcode);
		const { currentValue } = await this.getOrSetParameter(opcode);
		return currentValue;
	}

	public async setParameter(opcode: Opcode, value: number) {
		console.log('nec setParameter', opcode);
		const { result, currentValue } = await this.getOrSetParameter(opcode, value);
		if (result > 0 || currentValue !== value) {
			throw new Error('failed to set parameter');
		}
	}

	public async getPowerStatus() {
		console.log('nec getPowerStatus');
		const monitorId = await this.getMonitorId();
		return await this.necSerialPort.getPowerStatus(monitorId);
	}

	public async setPowerStatus(powerStatus: PowerStatus) {
		console.log('nec setPowerStatus', powerStatus);
		const monitorId = await this.getMonitorId();
		return await this.necSerialPort.setPowerStatus(monitorId, powerStatus);
	}

	public async getSchedule(index: number) {
		console.log('nec getSchedule', index);
		const monitorId = await this.getMonitorId();
		return await this.necSerialPort.getSchedule(monitorId, index);
	}

	public async setSchedule(schedule: ISchedule) {
		console.log('nec setSchedule', schedule);
		const monitorId = await this.getMonitorId();
		return await this.necSerialPort.setSchedule(monitorId, schedule);
	}

	public async disableSchedule(index: number) {
		console.log('nec disableSchedule', index);
		const monitorId = await this.getMonitorId();
		return await this.necSerialPort.disableSchedule(monitorId, index);
	}

	public async lockComputeModuleSettings() {
		console.log('nec lockComputeModuleSettings');
		const monitorId = await this.getMonitorId();
		return await this.necSerialPort.lockComputeModuleSettings(monitorId);
	}

	public async unlockComputeModuleSettings() {
		console.log('nec unlockComputeModuleSettings');
		const monitorId = await this.getMonitorId();
		return await this.necSerialPort.unlockComputeModuleSettings(monitorId);
	}

	public async getDisplayTime() {
		console.log('nec getDisplayTime');
		const monitorId = await this.getMonitorId();
		return await this.necSerialPort.getDateAndTime(monitorId);
	}

	public async setDisplayTimeFromSystem() {
		console.log('nec setDisplayTimeFromSystem');
		const monitorId = await this.getMonitorId();
		const now = new Date();
		return await this.necSerialPort.setDateAndTime(monitorId, now);
	}

	public async getModelName() {
		console.log('nec getModelName');
		const monitorId = await this.getMonitorId();
		return await this.necSerialPort.getModelName(monitorId);
	}

	public async getSerialNumber() {
		console.log('nec getSerialNumber');
		const monitorId = await this.getMonitorId();
		return await this.necSerialPort.getSerialNumber(monitorId);
	}

	public async getFirmwareVersion() {
		console.log('nec getFirmwareVersion');
		const monitorId = await this.getMonitorId();
		return await this.necSerialPort.getFirmwareVersion(monitorId);
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
