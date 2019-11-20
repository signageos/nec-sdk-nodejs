import INetwork from "@signageos/front-display/es6/NativeDevice/Network/INetwork";
import INetworkInfo, {
	INetworkOptions,
	NetworkInterface,
} from "@signageos/front-display/es6/Management/Device/Network/INetworkInfo";
import * as NetworkAPI from '../API/NetworkAPI';

export default class Network implements INetwork {

	public async getActiveInfo(): Promise<INetworkInfo> {
		const ethernet = await NetworkAPI.getEthernet();
		const wifi = await NetworkAPI.getWifi();
		const gateway = await NetworkAPI.getDefaultGateway();
		const dns = await NetworkAPI.getDNSSettings();

		let localAddress: string | undefined = undefined;
		let activeInterface: NetworkInterface | undefined = undefined;
		let netmask: string | undefined = undefined;

		if (ethernet) {
			localAddress = ethernet.ip;
			activeInterface = 'ethernet';
			netmask = ethernet.netmask;
		} else if (wifi) {
			localAddress = wifi.ip;
			activeInterface = 'wifi';
			netmask = wifi.netmask;
		}

		return {
			localAddress,
			ethernetMacAddress: ethernet ? ethernet.mac : undefined,
			wifiMacAddress: wifi ? wifi.mac : undefined,
			activeInterface,
			gateway: gateway || undefined,
			netmask,
			dns,
		};
	}

	public async setManual(options: INetworkOptions): Promise<void> {
		await NetworkAPI.setManual(options);
	}

	public async setDHCP(networkInterface: NetworkInterface): Promise<void> {
		await NetworkAPI.setDHCP(networkInterface);
	}
}
