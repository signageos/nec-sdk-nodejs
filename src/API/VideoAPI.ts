import {
	execApiCommand,
	spawnApiCommandChildProcess,
} from './apiCommand';
import Orientation from '@signageos/front-display/es6/NativeDevice/Orientation';

export function playVideo(
	filePath: string,
	x: number,
	y: number,
	width: number,
	height: number,
	orientation: Orientation,
) {
	const windowCoords = `${x},${y},${width},${height}`;
	const rotationAngle = convertOrientationToRotationAngle(orientation).toString();

	return spawnApiCommandChildProcess('video', 'play', [
		windowCoords,
		rotationAngle,
		filePath,
	]);
}

export function playStream(
	filePath: string,
	x: number,
	y: number,
	width: number,
	height: number,
	orientation: Orientation,
) {
	const windowCoords = `${x},${y},${width},${height}`;
	const rotationAngle = convertOrientationToRotationAngle(orientation).toString();

	return spawnApiCommandChildProcess('stream', 'play', [
		windowCoords,
		rotationAngle,
		filePath,
	]);
}

export async function generateLastFrame(
	sourceVideoFilePath: string,
	lastFrameFileDestination: string,
) {
	const args = sourceVideoFilePath + ' ' + lastFrameFileDestination;
	await execApiCommand('video', 'generate_last_frame', args);
}

function convertOrientationToRotationAngle(orientation: Orientation) {
	switch (orientation) {
		case Orientation.PORTRAIT:
			return 90;
		case Orientation.LANDSCAPE_FLIPPED:
			return 180;
		case Orientation.PORTRAIT_FLIPPED:
			return 270;
		default:
			return 0;
	}
}
