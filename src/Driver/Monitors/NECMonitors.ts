import IMonitors, { IMonitor } from '@signageos/front-display/es6/NativeDevice/IMonitors';
import NECPD from '@signageos/nec-sdk/dist/NECPD';

export default class NECMonitors implements IMonitors {

	constructor(private necPD: NECPD) {}

	public async getList(): Promise<IMonitor[]> {
		const manufacturer = 'NEC';
		const model = await this.necPD.getModelName();
		const serial = await this.necPD.getSerialNumber();
		const firmware = await this.necPD.getFirmwareVersion();
		return [{ manufacturer, model, serial, firmware }];
	}
}
