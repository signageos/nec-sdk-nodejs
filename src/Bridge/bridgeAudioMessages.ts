
export const SetVolume = 'Audio.SetVolume';
export interface SetVolume {
	type: typeof SetVolume;
	volume: number;
}

export const GetVolume = 'Audio.GetVolume';
export interface GetVolume {
	type: typeof GetVolume;
}
