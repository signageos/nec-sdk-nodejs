import IMonitors, { IMonitor } from '@signageos/front-display/es6/NativeDevice/IMonitors';
import { INECAPI } from '../../API/NECAPI';

export default class NECMonitors implements IMonitors {

	constructor(
		private necAPI: INECAPI,
	) {}

	public async getList(): Promise<IMonitor[]> {
		const manufacturer = 'NEC';
		const [model, serial, firmware] = await Promise.all([
			this.necAPI.getModel(),
			this.necAPI.getSerialNumber(),
			this.necAPI.getFirmwareVersion(),
		]);
		return [{ manufacturer, model, serial, firmware }];
	}
}
