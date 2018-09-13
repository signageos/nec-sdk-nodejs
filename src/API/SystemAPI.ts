import { execChildProcess } from './childProcess';

export async function getSerialNumber() {
	return await execChildProcess("cat /proc/cpuinfo | grep Serial | cut -d ' ' -f 2");
}

export async function getModel() {
	return await execChildProcess("lshw | grep product | head -1 | cut -c 14-");
}

export async function getCpuTemperature() {
	const temperatureInMiliCelsiusString = await execChildProcess('cat /sys/class/thermal/thermal_zone0/temp');
	const temperatureInMiliCelsius = parseInt(temperatureInMiliCelsiusString, 10);
	return temperatureInMiliCelsius / 1000;
}

export async function reboot() {
	console.log("reboot device");
	await execChildProcess("sudo /sbin/shutdown -r now");
}

export async function upgradeApp(debFile: string) {
	const escapedDebFile = debFile.replace(/\'/g, "\\'");
	await execChildProcess(`sudo dpkg -i '${escapedDebFile}'`);
}

export async function turnScreenOff() {
	await execChildProcess('vcgencmd display_power 0');
}

export async function turnScreenOn() {
	await execChildProcess('vcgencmd display_power 1');
}
