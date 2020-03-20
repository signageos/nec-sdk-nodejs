import { execGetApiVersion, execApiCommand, spawnApiCommandChildProcess } from './apiCommand';
import { ChildProcess } from 'child_process';

export interface ISystemAPI {
	getSerialNumber(): Promise<string>;
	getModel(): Promise<string>;
	getStorageStatus(): Promise<IStorageUnit[]>;
	getCpuTemperature(): Promise<number>;
	reboot(): Promise<void>;
	applicationNotifyAlive(): Promise<void>;
	applicationNotifyStopped(): Promise<void>;
	restartApplication(): Promise<void>;
	restartServer(): Promise<void>;
	upgradeApp(version: string): Promise<void>;
	getFirmwareVersion(): Promise<string>;
	overwriteFirmware(imgUrl: string): Promise<void>;
	factoryReset(): Promise<void>;
	enableNativeDebug(): Promise<void>;
	disableNativeDebug(): Promise<void>;
	turnScreenOff(): Promise<void>;
	turnScreenOn(): Promise<void>;
	getDatetime(): Promise<string>;
	setDatetime(datetime: string): Promise<void>;
	getTimezone(): Promise<string>;
	setTimezone(timezone: string): Promise<void>;
	getNTPServer(): Promise<string>;
	setNTPServer(ntpServer: string): Promise<void>;
	takeScreenshot(destination: string): Promise<void>;
	listenToCECKeypresses(socketPath: string): ChildProcess;
	getFileMimeType(filePath: string): Promise<string>;
	setWebACLWhitelist(acl: string[]): Promise<void>;
	setWebACLBlacklist(acl: string[]): Promise<void>;
	clearWebACL(): Promise<void>;
}

export interface IStorageUnit {
	type: string;
	usedSpace: number;
	availableSpace: number;
}

export function createSystemAPI(): ISystemAPI {
	return {
		async getSerialNumber() {
			return await execApiCommand('system_info', 'serial');
		},

		async getModel() {
			return await execApiCommand('system_info', 'model', [], { asRoot: true });
		},

		async getStorageStatus(): Promise<IStorageUnit[]> {
			const result = await execApiCommand('system_info', 'storage');
			const linesSplit = result.split("\n");
			return linesSplit.map((line: string) => {
				const [type, usedSpace, availableSpace] = line.split(',');
				return {
					type,
					usedSpace: usedSpace ? parseInt(usedSpace) * 1000 : 0,
					availableSpace: availableSpace ? parseInt(availableSpace) * 1000 : 0,
				} as IStorageUnit;
			});
		},

		async getCpuTemperature() {
			const temperatureInMiliCelsiusString = await execApiCommand('cpu', 'temperature');
			const temperatureInMiliCelsius = parseInt(temperatureInMiliCelsiusString, 10);
			return temperatureInMiliCelsius / 1000;
		},

		async reboot() {
			console.log("reboot device");
			await execApiCommand('device', 'reboot', [], { asRoot: true });
		},

		async applicationNotifyAlive() {
			await execApiCommand('application', 'notify_alive', [], { asRoot: true });
		},

		async applicationNotifyStopped() {
			await execApiCommand('application', 'notify_stopped', [], { asRoot: true });
		},

		async restartApplication() {
			await execApiCommand('application', 'restart_wpewebkit', [], { asRoot: true });
		},

		async restartServer(): Promise<void> {
			await execApiCommand('application', 'restart_server', [], { asRoot: true });
		},

		async upgradeApp(version: string) {
			await execApiCommand('application', 'upgrade', [version], { asRoot: true, verbose: true });
		},

		async getFirmwareVersion() {
			return await execGetApiVersion();
		},

		async overwriteFirmware(imgUrl: string) {
			await execApiCommand('firmware', 'overwrite', [imgUrl], { asRoot: true, verbose: true });
		},

		async factoryReset(): Promise<void> {
			await execApiCommand('system', 'factory_reset', [], { asRoot: true });
		},

		async enableNativeDebug() {
			await execApiCommand('debug', 'on');
		},

		async disableNativeDebug() {
			await execApiCommand('debug', 'off');
		},

		async turnScreenOff() {
			await execApiCommand('screen', 'off', [], { asRoot: true });
		},

		async turnScreenOn() {
			await execApiCommand('screen', 'on', [], { asRoot: true });
		},

		async getDatetime() {
			return await execApiCommand('time', 'get_datetime');
		},

		async setDatetime(datetime: string) {
			await execApiCommand('time', 'set_datetime', [datetime], { asRoot: true });
		},

		async getTimezone() {
			return await execApiCommand('time', 'get_timezone');
		},

		async setTimezone(timezone: string) {
			await execApiCommand('time', 'set_timezone', [timezone], { asRoot: true });
		},

		async getNTPServer() {
			return await execApiCommand('time', 'get_ntp_server');
		},

		async setNTPServer(ntpServer: string) {
			await execApiCommand('time', 'set_ntp_server', [ntpServer], { asRoot: true });
		},

		async takeScreenshot(destination: string) {
			await execApiCommand('screen', 'screenshot', [destination], { asRoot: true });
		},

		listenToCECKeypresses(socketPath: string) {
			return spawnApiCommandChildProcess('cec', 'listen', [socketPath]);
		},

		async getFileMimeType(filePath: string) {
			return await execApiCommand('file', 'mime_type', [filePath]);
		},

		async setWebACLWhitelist(acl: string[]): Promise<void> {
			await execApiCommand('web', 'set_acl_whitelist', acl, { asRoot: true });
		},

		async setWebACLBlacklist(acl: string[]): Promise<void> {
			await execApiCommand('web', 'set_acl_blacklist', acl, { asRoot: true });
		},

		async clearWebACL(): Promise<void> {
			await execApiCommand('web', 'clear_acl', [], { asRoot: true });
		},
	};
}
