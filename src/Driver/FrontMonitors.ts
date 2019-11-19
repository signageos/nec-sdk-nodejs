import IMonitors, { IMonitor } from '@signageos/front-display/es6/NativeDevice/IMonitors';
import BridgeClient from '../Bridge/BridgeClient';
import { GetMonitorsList } from '../Bridge/bridgeMonitorsMessages';

export default class FrontMonitors implements IMonitors {

	constructor(
		private bridge: BridgeClient,
	) {}

	public async getList(): Promise<IMonitor[]> {
		const { monitors } = await this.bridge.invoke<GetMonitorsList, { monitors: IMonitor[] }>({
			type: GetMonitorsList,
		});
		return monitors;
	}
}
