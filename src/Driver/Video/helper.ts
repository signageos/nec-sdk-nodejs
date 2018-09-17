import { checksumString } from '@signageos/front-display/es6/Hash/checksum';

export function getLastFramePathFromVideoPath(videoPath: string) {
	return videoPath + '.last_frame.bmp';
}

export function getVideoIdentificator(uri: string, x: number, y: number, width: number, height: number) {
	return checksumString(uri) + '_' + x + 'x' + y + '-' + width + 'x' + height;
}

export interface Coordinates {
	x: number;
	y: number;
	width: number;
	height: number;
}

export function convertToPortrait(window: Window, x: number, y: number, width: number, height: number): Coordinates {
	return {
		x: window.innerWidth - (y + height),
		y: x,
		width: height,
		height: width,
	};
}

export function convertToPortraitFlipped(window: Window, x: number, y: number, width: number, height: number): Coordinates {
	return {
		x: y,
		y: window.innerHeight - (x + width),
		width: height,
		height: width,
	};
}

export function convertToLandscapeFlipped(window: Window, x: number, y: number, width: number, height: number): Coordinates {
	return {
		x: window.innerWidth - (x + width),
		y: window.innerHeight - (y + height),
		width,
		height,
	};
}
