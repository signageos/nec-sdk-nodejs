import { ChildProcess } from 'child_process';
import {
	spawnApiCommandChildProcess,
	execApiCommand,
} from './apiCommand';

export function showOverlay(
	file: string,
	x?: number,
	y?: number,
	horizontalTranslation?: number,
	verticalTranslation?: number,
	maxHorizontalOffset?: number,
	maxVerticalOffset?: number,
) {
	const args: string[] = [];
	if (typeof x !== 'undefined') {
		args.push('-x ' + x);
	}
	if (typeof y !== 'undefined') {
		args.push('-y ' + y);
	}
	if (typeof horizontalTranslation !== 'undefined') {
		args.push('-h ' + horizontalTranslation);
	}
	if (typeof verticalTranslation !== 'undefined') {
		args.push('-v ' + verticalTranslation);
	}
	if (typeof maxHorizontalOffset !== 'undefined') {
		args.push('--max-horizontal-offset=' + maxHorizontalOffset);
	}
	if (typeof maxVerticalOffset !== 'undefined') {
		args.push('--max-vertical-offset=' + maxVerticalOffset);
	}

	return spawnApiCommandChildProcess('overlay', 'show', [
		'-l 2',
		...args,
		file,
	]);
}

export async function refreshOverlay(overlayProcess: ChildProcess) {
	const pid = overlayProcess.pid;
	await execApiCommand('overlay', 'refresh', pid.toString());
}
