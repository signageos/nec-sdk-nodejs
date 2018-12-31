import { execApiCommand, spawnApiCommandChildProcess } from './apiCommand';

export async function getSerialNumber() {
	return await execApiCommand('system_info', 'serial');
}

export async function getModel() {
	return await execApiCommand('system_info', 'model');
}

export interface IStorageUnit {
	type: string;
	usedSpace: number;
	availableSpace: number;
}

export async function getStorageStatus(): Promise<IStorageUnit[]> {
	const result = await execApiCommand('system_info', 'storage');
	const linesSplit = result.trim().split("\n");
	return linesSplit.map((line: string) => {
		const [type, usedSpace, availableSpace] = line.split(',');
		return {
			type,
			usedSpace: usedSpace ? parseInt(usedSpace) * 1000 : 0,
			availableSpace: availableSpace ? parseInt(availableSpace) * 1000 : 0,
		} as IStorageUnit;
	});
}

export async function getCpuTemperature() {
	const temperatureInMiliCelsiusString = await execApiCommand('cpu', 'temperature');
	const temperatureInMiliCelsius = parseInt(temperatureInMiliCelsiusString, 10);
	return temperatureInMiliCelsius / 1000;
}

export async function reboot() {
	console.log("reboot device");
	await execApiCommand('device', 'reboot');
}

export async function restartApplication() {
	await execApiCommand('application', 'restart');
}

export async function upgradeApp(debFile: string) {
	const escapedDebFile = escapeBashArgument(debFile);
	await execApiCommand('application', 'upgrade', escapedDebFile);
}

export async function getFirmwareVersion() {
	return await execApiCommand('firmware', 'version');
}

export async function upgradeFirmware(sourceUrl: string) {
	const escapedSourceUrl = escapeBashArgument(sourceUrl);
	await execApiCommand('firmware', 'upgrade', escapedSourceUrl);
}

export async function enableNativeDebug() {
	await execApiCommand('debug', 'on');
}

export async function disableNativeDebug() {
	await execApiCommand('debug', 'off');
}

export async function turnScreenOff() {
	await execApiCommand('screen', 'off');
}

export async function turnScreenOn() {
	await execApiCommand('screen', 'on');
}

export async function takeScreenshot(destination: string) {
	await execApiCommand('screen', 'screenshot', destination);
}

export function listenToCECKeypresses(socketPath: string) {
	return spawnApiCommandChildProcess('cec', 'listen', [socketPath]);
}

function escapeBashArgument(argument: string) {
	return argument.replace(/\'/g, "\\'");
}
