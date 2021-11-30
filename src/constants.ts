export enum AudioMutedStatus {
	MUTED = 1,
	UNMUTED = 2,
}

export enum InputChangeType {
	NORMAL = 1,
	QUICK = 2,
	SUPER_QUICK = 3,
}

export enum VideoInput {
	HDMI1 = 17,
	HDMI2 = 18,
	HDMI3 = 130,
	HDMI4 = 131,
	DVI = 3,
	DP = 15,
	COMPUTE_MODULE = 136,
}

export enum CECMode {
	MODE1 = 2,
	MODE2 = 3,
}

export enum CECSearchDevice {
	NO = 1,
	YES = 2,
}

export enum CECAutoTurnOff {
	NO = 1,
	YES = 2,
}

export enum ComputeModuleFanMode {
	OFF = 1,
	ON = 2,
}

export enum HumanSensorInstalledStatus {
	NOT_INSTALLED = 1,
	INSTALLED = 2,
}

export enum HumanSensorDetectionStatus {
	NOT_DETECTED = 1,
	DETECTED = 2,
}

export enum PowerStatus {
	ON = 1,
	STANDBY = 2,
	SUSPEND = 3,
	OFF = 4,
}

export enum ScheduleEvent {
	ON = 1,
	OFF = 2,
}

export enum ScheduleType {
	SPECIFIC_DAYS = 6,
}

export enum ScheduleEnabledStatus {
	DISABLED = 0,
	ENABLED = 1,
}

export const MAX_SCHEDULE_INDEX_CM3 = 29;
export const MAX_SCHEDULE_INDEX_CM4 = 13;

export enum USBPCSource {
	AUTO = 1,
}

export enum HDMISignal {
	RAW = 2,
}

export enum ComputeModuleAutoPowerOn {
	ENABLED = 2,
}

export enum ComputeModuleLockMode {
	LOCKED = 1,
	UNLOCKED = 0,
}

export enum ComputeModuleWatchdogStatus {
	DISABLED = 1,
}

export enum ComputeModuleShutdownSignalStatus {
	DISABLED = 1,
}

export const COMPUTE_MODULE_DEFAULT_SETTINGS_PASSWORD = '0000';

export enum FirmwareType {
	TYPE0 = 0,
}

export enum OSDInformation {
	DISABLED = 0,
}

export enum OSDOrientation {
	LANDSCAPE = 0,
	PORTRAIT = 1,
	AUTO = 2,
}

export enum OSDSignalInformation {
	OFF = 1,
	ON = 2,
}

export enum GSensorReading {
	LANDSCAPE = 1, // NEC logo at the bottom
	WRONG_PORTRAIT = 2, // NEC logo on the left, not supported
	UPSIDE_DOWN = 3, // NEC logo on the top, not supported
	PORTRAIT = 4, // NEC logo on the right
}
