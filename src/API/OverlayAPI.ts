import { ChildProcess } from 'child_process';
import {
	spawnApiCommandChildProcess,
	execApiCommand,
} from './apiCommand';

export function showOverlay(
	file: string,
	x?: number,
	y?: number,
	animate: boolean = false,
	animationDuration: number = 0,
	animationKeyframes: {
		percentage: number;
		x: number;
		y: number;
	}[] = [],
) {
	const args: string[] = [];
	if (typeof x !== 'undefined') {
		args.push('-x ' + x);
	}
	if (typeof y !== 'undefined') {
		args.push('-y ' + y);
	}
	if (animate) {
		args.push('-a ' + animationDuration);
		for (let keyframe of animationKeyframes) {
			args.push(`-k ${keyframe.percentage},${keyframe.x},${keyframe.y}`);
		}
	}

	return spawnApiCommandChildProcess(
		'overlay',
		'show',
		['-l 2', ...args, file],
		false,
		true,
	);
}

export async function refreshOverlay(overlayProcess: ChildProcess) {
	const pid = overlayProcess.pid;
	await execApiCommand('overlay', 'refresh', [pid.toString()]);
}
