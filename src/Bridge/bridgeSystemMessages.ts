export const NotifyApplicationAlive = 'Application.NotifyAlive';
export interface NotifyApplicationAlive {
	type: typeof NotifyApplicationAlive;
}

export const GetDeviceUid = 'System.GetDeviceUid';
export interface GetDeviceUid {
	type: typeof GetDeviceUid;
}

export const GetModel = 'System.GetModel';
export interface GetModel {
	type: typeof GetModel;
}

export const GetSerialNumber = 'System.GetSerialNumber';
export interface GetSerialNumber {
	type: typeof GetSerialNumber;
}

export const NetworkGetInfo = 'Network.GetInfo';
export interface NetworkGetInfo {
	type: typeof NetworkGetInfo;
}

export const ScreenGetOrientation = 'Screen.GetOrientation';
export interface ScreenGetOrientation {
	type: typeof ScreenGetOrientation;
}
