import { execApiCommand } from './apiCommand';

export async function getSerialNumber() {
	return await execApiCommand('system_info', 'serial');
}

export async function getModel() {
	return await execApiCommand('system_info', 'model');
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

export async function takeScreenshot() {
	return await execApiCommand('screen', 'screenshot');
}

function escapeBashArgument(argument: string) {
	return argument.replace(/\'/g, "\\'");
}
