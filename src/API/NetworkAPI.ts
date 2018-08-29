import { resolve4 as resolveDns } from 'dns';
import { networkInterfaces as osGetNetworkInterfaces } from 'os';

export enum NetworkInterfaceType {
	WIFI,
	ETHERNET,
}

export interface INetworkInterface {
	type: NetworkInterfaceType;
	name: string;
	ip: string;
	mac: string;
}

export async function getNetworkInterfaces(): Promise<INetworkInterface[]> {
	const networkInterfaces = osGetNetworkInterfaces();
	const result: INetworkInterface[] = [];

	for (let name of Object.keys(networkInterfaces)) {
		const networkInterface = networkInterfaces[name][0];
		if (name.startsWith('eth')) {
			result.push({
				type: NetworkInterfaceType.ETHERNET,
				name,
				ip: networkInterface.address,
				mac: networkInterface.mac,
			});
		} else if (name.startsWith('wlan')) {
			result.push({
				type: NetworkInterfaceType.WIFI,
				name,
				ip: networkInterface.address,
				mac: networkInterface.mac,
			});
		}
	}

	return result;
}

export function isConnectedToInternet(domainToContact: string) {
	return new Promise<boolean>((resolve: (isConnected: boolean) => void) => {
		resolveDns(domainToContact, (error: Error) => {
			if (error) {
				resolve(false);
			} else {
				resolve(true);
			}
		});
	});
}
