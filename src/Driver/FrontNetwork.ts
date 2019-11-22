import INetwork from '@signageos/front-display/es6/NativeDevice/Network/INetwork';
import BridgeClient from '../Bridge/BridgeClient';
import INetworkInfo, { INetworkOptions, NetworkInterface } from '@signageos/front-display/es6/Management/Device/Network/INetworkInfo';
import { GetActiveInfo, SetManual, SetDHCP } from '../Bridge/bridgeNetworkMessages';

export default class FrontNetwork implements INetwork {

	constructor(
		private bridge: BridgeClient,
	) {}

	public async getActiveInfo(): Promise<INetworkInfo> {
		const { networkInfo } = await this.bridge.invoke<GetActiveInfo, { networkInfo: INetworkInfo }>({
			type: GetActiveInfo,
		});
		return networkInfo;
	}

	public async setManual(options: INetworkOptions): Promise<void> {
		await this.bridge.invoke<SetManual, void>({
			type: SetManual,
			options,
		});
	}

	public async setDHCP(networkInterface: NetworkInterface): Promise<void> {
		await this.bridge.invoke<SetDHCP, void>({
			type: SetDHCP,
			networkInterface,
		});
	}
}
