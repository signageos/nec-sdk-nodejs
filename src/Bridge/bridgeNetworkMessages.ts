export const IsWifiSupported = 'Network.IsWifiSupported';
export interface IsWifiSupported {
	type: typeof IsWifiSupported;
}

export const IsWifiEnabled = 'Network.IsWifiEnabled';
export interface IsWifiEnabled {
	type: typeof IsWifiEnabled;
}

export const EnableWifi = 'Network.EnableWifi';
export interface EnableWifi {
	type: typeof EnableWifi;
}

export const DisableWifi = 'Network.DisableWifi';
export interface DisableWifi {
	type: typeof DisableWifi;
}

export const ConnectToWifi = 'Network.ConnectToWifi';
export interface ConnectToWifi {
	type: typeof ConnectToWifi;
	ssid: string;
	password?: string;
}

export const DisconnectFromWifi = 'Network.DisconnectFromWifi';
export interface DisconnectFromWifi {
	type: typeof DisconnectFromWifi;
}

export const GetConnectedToWifi = 'Network.GetConnectedToWifi';
export interface GetConnectedToWifi {
	type: typeof GetConnectedToWifi;
}

export const GetWifiCountryCode = 'Network.GetWifiCountryCode';
export interface GetWifiCountryCode {
	type: typeof GetWifiCountryCode;
}

export const SetWifiCountryCode = 'Network.SetWifiCountryCode';
export interface SetWifiCountryCode {
	type: typeof SetWifiCountryCode;
	countryCode: string;
}

export const ScanWifiDevices = 'Network.ScanWifiDevices';
export interface ScanWifiDevices {
	type: typeof ScanWifiDevices;
}
