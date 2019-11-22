import * as _ from 'lodash';
import { resolve4 as resolveDns } from 'dns';
import { networkInterfaces as osGetNetworkInterfaces } from 'os';
import { execApiCommand } from './apiCommand';
import { INetworkOptions, NetworkInterface } from '@signageos/front-display/es6/Management/Device/Network/INetworkInfo';

export enum NetworkInterfaceType {
	WIFI,
	ETHERNET,
}

export interface INetworkInterface {
	type: NetworkInterfaceType;
	name: string;
	ip: string;
	mac: string;
	netmask: string;
}

const IFACE_PREFIX_MAP: { [K in NetworkInterface]: string } = {
	['ethernet']: 'eth',
	['wifi']: 'wlan',
};

export async function getEthernet(): Promise<INetworkInterface | null> {
	const networkInterfaces = osGetNetworkInterfaces();

	for (let name of Object.keys(networkInterfaces)) {
		const networkInterface = networkInterfaces[name][0];
		if (name.startsWith(IFACE_PREFIX_MAP.ethernet)) {
			return {
				type: NetworkInterfaceType.ETHERNET,
				name,
				ip: networkInterface.address,
				mac: networkInterface.mac,
				netmask: networkInterface.netmask,
			};
		}
	}

	return null;
}

export async function getWifi(): Promise<INetworkInterface | null> {
	const networkInterfaces = osGetNetworkInterfaces();

	for (let name of Object.keys(networkInterfaces)) {
		const networkInterface = networkInterfaces[name][0];
		if (name.startsWith(IFACE_PREFIX_MAP.wifi)) {
			return {
				type: NetworkInterfaceType.WIFI,
				name,
				ip: networkInterface.address,
				mac: networkInterface.mac,
				netmask: networkInterface.netmask,
			};
		}
	}

	return null;
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

export async function setManual(options: INetworkOptions) {
	const networkInterfaces = osGetNetworkInterfaces();
	const networkInterfaceName = Object.keys(networkInterfaces).find((name: string) => name.startsWith(IFACE_PREFIX_MAP[options.interface]));
	if (!networkInterfaceName) {
		throw new Error(`Cannot find available interface ${options.interface}`);
	}
	return await execApiCommand(
		'network',
		'set_manual',
		[
			'--address',
			options.localAddress,
			'--gateway',
			options.gateway,
			'--netmask',
			options.netmask,
			'--dns',
			options.dns.join(','),
			'--iface',
			networkInterfaceName,
		],
		{ asRoot: true },
	);
}

export async function setDHCP(networkInterface: NetworkInterface) {
	const networkInterfaces = osGetNetworkInterfaces();
	const networkInterfaceName = Object.keys(networkInterfaces).find((name: string) => name.startsWith(IFACE_PREFIX_MAP[networkInterface]));
	if (!networkInterfaceName) {
		throw new Error(`Cannot find available interface ${networkInterface}`);
	}
	return await execApiCommand(
		'network',
		'set_dhcp',
		[
			'--iface',
			networkInterfaceName,
		],
		{ asRoot: true },
	);
}

export async function getDefaultGateway() {
	const result = await execApiCommand('network', 'gateway');
	return result.trim();
}

export async function getDNSSettings() {
	const dnsSettings = await execApiCommand('network', 'dns');
	return dnsSettings.trim().split("\n");
}

export async function isWifiSupported() {
	const result = await execApiCommand('wifi', 'is_supported');
	return result.trim() === '1';
}

export async function isWifiEnabled() {
	const result = await execApiCommand('wifi', 'is_enabled');
	return result.trim() === '1';
}

export async function enableWifi() {
	await execApiCommand('wifi', 'enable', [], { asRoot: true });
}

export async function disableWifi() {
	await execApiCommand('wifi', 'disable', [], { asRoot: true });
}

export async function connectToWifi(ssid: string, password?: string) {
	const args = [ssid];
	if (password) {
		args.push(password);
	}
	await execApiCommand('wifi', 'connect', args, { asRoot: true });
}

export async function disconnectFromWifi() {
	await execApiCommand('wifi', 'disconnect', [], { asRoot: true });
}

export async function getConnectedToWifi() {
	const ssid = await execApiCommand('wifi', 'get_connected_to');
	return ssid.trim() || null;
}

export async function getWifiCountryCode() {
	const countryCode = await execApiCommand('wifi', 'get_country');
	return countryCode.trim() || null;
}

export async function setWifiCountryCode(countryCode: string) {
	await execApiCommand('wifi', 'set_country', [countryCode], { asRoot: true });
}

export interface IWifiDevice {
	ssid: string;
	address: string;
	encrypted: boolean;
}

export async function scanWifiDevices(): Promise<IWifiDevice[]> {
	const devicesJson = await execApiCommand('wifi', 'scan', ['--json'], { asRoot: true });
	const devices = JSON.parse(devicesJson);
	return _.uniqWith(devices, (device1: IWifiDevice, device2: IWifiDevice) => device1.ssid === device2.ssid);
}
