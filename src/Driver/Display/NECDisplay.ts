import * as moment from 'moment-timezone';
import TimerWeekday from '@signageos/front-display/es6/NativeDevice/Timer/TimerWeekday';
import ITimer from '@signageos/front-display/es6/NativeDevice/Timer/ITimer';
import TimerType from '@signageos/front-display/es6/NativeDevice/Timer/TimerType';
import NECPD from '@signageos/nec-sdk/dist/NECPD';
import Opcode from '@signageos/nec-sdk/dist/Opcode';
import {
	AudioMutedStatus,
	InputChangeType,
	VideoInput as NECVideoInput,
	CECMode,
	CECSearchDevice,
	ComputeModuleFanMode,
	PowerStatus,
	ScheduleEvent,
	MAX_SCHEDULE_INDEX,
	OSDOrientation,
} from '@signageos/nec-sdk/dist/constants';
import { ISchedule } from '@signageos/nec-sdk/dist/facade';
import IDisplay, { VideoInput } from './IDisplay';
import DisplayCapability from './DisplayCapability';
import Orientation from '@signageos/front-display/es6/NativeDevice/Orientation';
import {
	convertSchedulesToTimers,
	getOnScheduleIndexFromTimerIndex,
	getOffScheduleIndexFromTimerIndex,
	convertDaysListToByteValue,
	createSchedule,
	isScheduleEnabled,
} from '../../NEC/scheduleHelpers';

const REFRESH_DISPLAY_TIME_INTERVAL = 5 * 60e3; // 5 minutes

export default class NECDisplay implements IDisplay {

	constructor(private necPD: NECPD) {
		setInterval(
			() => this.necPD.setDisplayTimeFromSystem(),
			REFRESH_DISPLAY_TIME_INTERVAL,
		);
	}

	public supports(capability: DisplayCapability): boolean {
		switch (capability) {
			case DisplayCapability.BRIGHTNESS:
			case DisplayCapability.SCHEDULE:
			case DisplayCapability.CPU_FAN:
				return true;

			default:
				return false;
		}
	}

	public async isPowerOn(): Promise<boolean> {
		const powerStatus = await this.necPD.getPowerStatus();
		return powerStatus === PowerStatus.ON;
	}

	public powerOff(): Promise<void> {
		return this.necPD.setPowerStatus(PowerStatus.OFF);
	}

	public powerOn(): Promise<void> {
		return this.necPD.setPowerStatus(PowerStatus.ON);
	}

	public getBrightness(): Promise<number> {
		return this.necPD.getParameter(Opcode.SCREEN_BRIGHTNESS);
	}

	public setBrightness(brightness: number): Promise<void> {
		return this.necPD.setParameter(Opcode.SCREEN_BRIGHTNESS, brightness);
	}

	public async getVolume(): Promise<number> {
		const mutedStatus = await this.necPD.getParameter(Opcode.AUDIO_MUTE);
		if (mutedStatus === AudioMutedStatus.MUTED) {
			return 0;
		} else {
			return await this.necPD.getParameter(Opcode.AUDIO_VOLUME);
		}
	}

	public async setVolume(volume: number): Promise<void> {
		await this.necPD.setParameter(Opcode.AUDIO_VOLUME, volume);
		if (volume > 0) {
			await this.necPD.setParameter(Opcode.AUDIO_MUTE, AudioMutedStatus.UNMUTED);
		}
	}

	public async getTimers(): Promise<ITimer[]> {
		const schedules: ISchedule[] = [];
		for (let i = 0; i < MAX_SCHEDULE_INDEX; i++) {
			const schedule = await this.necPD.getSchedule(i);
			if (isScheduleEnabled(schedule)) {
				schedules.push(schedule);
			}
		}
		return convertSchedulesToTimers(schedules);
	}

	public async setTimer(type: TimerType, timeOn: string | null, timeOff: string | null, days: TimerWeekday[]): Promise<void> {
		const onIndex = getOnScheduleIndexFromTimerIndex(type);
		const offIndex = getOffScheduleIndexFromTimerIndex(type);
		const daysByteValue = convertDaysListToByteValue(days);

		if (timeOn) {
			const onMoment = moment(timeOn!, 'HH:mm:ss');
			const onHour = onMoment.hour();
			const onMinute = onMoment.minute();
			const onSchedule = createSchedule(onIndex, ScheduleEvent.ON, onHour, onMinute, daysByteValue);
			await this.necPD.setSchedule(onSchedule);
		} else {
			await this.necPD.disableSchedule(onIndex);
		}

		if (timeOff) {
			const offMoment = moment(timeOff!, 'HH:mm:ss');
			const offHour = offMoment.hour();
			const offMinute = offMoment.minute();
			const offSchedule = createSchedule(offIndex, ScheduleEvent.OFF, offHour, offMinute, daysByteValue);
			await this.necPD.setSchedule(offSchedule);
		} else {
			await this.necPD.disableSchedule(offIndex);
		}
	}

	public async openVideoInput(videoInput: VideoInput): Promise<void> {
		const videoInputValue = NECVideoInput[VideoInput[videoInput] as keyof typeof NECVideoInput];
		if (typeof videoInputValue === 'undefined') {
			throw new Error('invalid video input ' + videoInput);
		}
		await this.necPD.setParameter(Opcode.INPUT_CHANGE, InputChangeType.SUPER_QUICK);
		await this.necPD.setParameter(Opcode.INPUT_CHANGE_SUPER_INPUT_1, NECVideoInput.COMPUTE_MODULE);
		await this.necPD.setParameter(Opcode.INPUT_CHANGE_SUPER_INPUT_2, videoInputValue);
		await this.necPD.setParameter(Opcode.INPUT, videoInputValue);
	}

	public closeVideoInput(): Promise<void> {
		return this.necPD.setParameter(Opcode.INPUT, NECVideoInput.COMPUTE_MODULE);
	}

	public async initCEC() {
		const maxValueSupported = await this.necPD.getMaxValue(Opcode.CEC);
		if (maxValueSupported === CECMode.MODE2) {
			await this.necPD.setParameter(Opcode.CEC, CECMode.MODE2);
		} else {
			await this.necPD.setParameter(Opcode.CEC, CECMode.MODE1);
		}
		await this.necPD.setParameter(Opcode.CEC_SEARCH_DEVICE, CECSearchDevice.YES);
	}

	public async resetSettings(): Promise<void> {
		throw new Error('not implemented'); // TODO implement
	}

	public cpuFanOn(): Promise<void> {
		return this.necPD.setParameter(Opcode.COMPUTE_MODULE_FAN_POWER_MODE, ComputeModuleFanMode.ON);
	}

	public async cpuFanOff(): Promise<void> {
		return this.necPD.setParameter(Opcode.COMPUTE_MODULE_FAN_POWER_MODE, ComputeModuleFanMode.OFF);
	}

	public async setOSDOrientation(orientation: Orientation): Promise<void> {
		const orientationKey = OSDOrientation[orientation] as keyof typeof OSDOrientation;
		let osdOrientation = OSDOrientation[orientationKey];
		if (typeof osdOrientation === 'undefined') {
			osdOrientation = OSDOrientation.LANDSCAPE;
		}
		await this.necPD.setParameter(Opcode.OSD_ROTATION, osdOrientation);
	}
}
