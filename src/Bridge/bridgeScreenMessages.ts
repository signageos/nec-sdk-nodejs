import Orientation from "@signageos/front-display/es6/NativeDevice/Orientation";
import IBrightness from "@signageos/front-display/es6/NativeDevice/IBrightness";

export const SetOrientation = 'Screen.SetOrientation';
export interface SetOrientation {
	type: typeof SetOrientation;
	orientation: Orientation;
}

export const PowerOff = 'Screen.PowerOff';
export interface PowerOff {
	type: typeof PowerOff;
}

export const PowerOn = 'Screen.PowerOn';
export interface PowerOn {
	type: typeof PowerOn;
}

export const IsPoweredOn = 'Screen.IsPoweredOn';
export interface IsPoweredOn {
	type: typeof IsPoweredOn;
}

export const SetBrightness = 'Screen.SetBrightness';
export interface SetBrightness {
	type: typeof SetBrightness;
	brightness: IBrightness;
}

export const GetBrightness = 'Screen.GetBrightness';
export interface GetBrightness {
	type: typeof GetBrightness;
}

export const ScreenshotUpload = 'Screen.ScreenshotUpload';
export interface ScreenshotUpload {
	type: typeof ScreenshotUpload;
	uploadBaseUrl: string;
}
