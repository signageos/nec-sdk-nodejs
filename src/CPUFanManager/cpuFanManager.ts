import IDisplay from '../Driver/Display/IDisplay';
import DisplayCapability from '../Driver/Display/DisplayCapability';
import * as SystemAPI from '../API/SystemAPI';
import * as Debug from 'debug';
const debug = Debug('@signageos/display-linux:CPUFanManager');

export function manageCpuFan(display: IDisplay) {
	const INTERVAL = 5e3;
	if (display.supports(DisplayCapability.CPU_FAN)) {
		setInterval(
			() => checkCpuTemperatureAndSetFanOnOff(display, SystemAPI.getCpuTemperature),
			INTERVAL,
		);
	}
}

enum FanDesiredState { ON, OFF, STAY_SAME}
let lastSetOn: boolean | null = null;

export async function checkCpuTemperatureAndSetFanOnOff(
	display: IDisplay,
	getCpuTemperature: () => Promise<number>,
) {
	console.log('check cpu temperature and control fan');
	try {
		const cpuTemperature = await getCpuTemperature();
		debug('cpu temperature', cpuTemperature);
		const fanDesiredState = getFanDesiredState(cpuTemperature);
		if (fanDesiredState === FanDesiredState.ON && !lastSetOn) {
			console.log('set cpu fan on');
			await display.cpuFanOn();
			lastSetOn = true;
		} else if (fanDesiredState === FanDesiredState.OFF && (lastSetOn || lastSetOn === null)) {
			console.log('set cpu fan off');
			await display.cpuFanOff();
			lastSetOn = false;
		}
	} catch (error) {
		console.log('check cpu temperature error', error);
	}
}

function getFanDesiredState(cpuTemperature: number): FanDesiredState {
	const LOW_THRESHOLD = 45;
	const HIGH_THRESHOLD = 60;
	if (cpuTemperature <= LOW_THRESHOLD) {
		return FanDesiredState.OFF;
	} else if (cpuTemperature >= HIGH_THRESHOLD) {
		return FanDesiredState.ON;
	} else {
		return FanDesiredState.STAY_SAME;
	}
}
