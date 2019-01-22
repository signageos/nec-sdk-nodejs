import * as _ from 'lodash';
import { resolve4 as resolveDns } from 'dns';
import { networkInterfaces as osGetNetworkInterfaces } from 'os';
import { execApiCommand } from './apiCommand';

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

export async function getEthernet(): Promise<INetworkInterface | null> {
	const networkInterfaces = osGetNetworkInterfaces();

	for (let name of Object.keys(networkInterfaces)) {
		const networkInterface = networkInterfaces[name][0];
		if (name.startsWith('eth')) {
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
		if (name.startsWith('wlan')) {
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

export async function getDefaultGateway() {
	return await execApiCommand('network', 'gateway');
}

export async function getDNSSettings() {
	const dnsSettings = await execApiCommand('network', 'dns');
	return dnsSettings.split("\n");
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
	await execApiCommand('wifi', 'enable');
}

export async function disableWifi() {
	await execApiCommand('wifi', 'disable');
}

export async function connectToWifi(ssid: string, password?: string) {
	const args = [ssid];
	if (password) {
		args.push(password);
	}
	await execApiCommand('wifi', 'connect', args);
}

export async function disconnectFromWifi() {
	await execApiCommand('wifi', 'disconnect');
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
	await execApiCommand('wifi', 'set_country', [countryCode]);
}

export interface IWifiDevice {
	ssid: string;
	address: string;
	encrypted: boolean;
}

export async function scanWifiDevices(): Promise<IWifiDevice[]> {
	const devicesJson = await execApiCommand('wifi', 'scan', ['--json']);
	const devices = JSON.parse(devicesJson);
	return _.uniqWith(devices, (device1: IWifiDevice, device2: IWifiDevice) => device1.ssid === device2.ssid);
}
