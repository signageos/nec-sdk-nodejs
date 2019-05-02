
export const Upgrade = 'Firmware.Upgrade';
export interface Upgrade {
	type: typeof Upgrade;
	baseUrl: string;
	version: string;
}

export const GetVersion = 'Firmware.GetVersion';
export interface GetVersion {
	type: typeof GetVersion;
}
