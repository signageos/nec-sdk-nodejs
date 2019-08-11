import { ChildProcess } from 'child_process';
import {
	execApiCommand,
	spawnApiCommandChildProcess,
} from './apiCommand';
import Orientation from '@signageos/front-display/es6/NativeDevice/Orientation';
import { SECOND_IN_MS } from '@signageos/lib/dist/DateTime/millisecondConstants';

export interface IVideoAPI {
	prepareVideo(
		filePath: string,
		x: number,
		y: number,
		width: number,
		height: number,
		orientation: Orientation,
		eventSocketPath: string,
		volume: number,
	): ChildProcess;
	playVideo(videoProcess: ChildProcess): Promise<void>;
	stopVideo(videoProcess: ChildProcess): Promise<void>;
	getVideoDurationMs(filePath: string): Promise<number>;
	prepareStream(
		filePath: string,
		x: number,
		y: number,
		width: number,
		height: number,
		orientation: Orientation,
		eventSocketPath: string,
		volume: number,
	): ChildProcess;

	playStream(streamProcess: ChildProcess): Promise<void>;
	stopStream(streamProcess: ChildProcess): Promise<void>;
}

export function createVideoAPI(): IVideoAPI {
	return {
		prepareVideo(
			filePath: string,
			x: number,
			y: number,
			width: number,
			height: number,
			orientation: Orientation,
			eventSocketPath: string,
			volume: number,
		) {
			const windowCoords = getVideoWindowArgsString(x, y, width, height);
			const rotationAngle = convertOrientationToRotationAngle(orientation).toString();

			return spawnApiCommandChildProcess(
				'video',
				'init',
				[
					windowCoords,
					rotationAngle,
					eventSocketPath,
					filePath,
					volume.toString(10),
				],
			);
		},

		async playVideo(videoProcess: ChildProcess) {
			await execApiCommand('video', 'play', [videoProcess.pid.toString()]);
		},

		async stopVideo(videoProcess: ChildProcess) {
			const stoppedPromise = new Promise<void>((resolve: () => void) => {
				const timeout = setTimeout(
					() => {
						videoProcess.kill('SIGKILL');
						resolve();
					},
					2 * SECOND_IN_MS,
				);

				function cancelKillTimeoutAndResolve() {
					clearTimeout(timeout);
					resolve();
				}

				videoProcess.once('close', cancelKillTimeoutAndResolve);
				videoProcess.once('error', cancelKillTimeoutAndResolve);
			});

			videoProcess.kill('SIGINT');
			await stoppedPromise;
		},

		async getVideoDurationMs(filePath: string): Promise<number> {
			const durationSecString = await execApiCommand('video', 'duration', [filePath]);
			const durationSec = parseFloat(durationSecString);
			if (isNaN(durationSec)) {
				throw new Error('Failed to get video duration, got NaN');
			}
			const durationMs = durationSec * 1000;
			return Math.trunc(durationMs);
		},

		prepareStream(
			filePath: string,
			x: number,
			y: number,
			width: number,
			height: number,
			orientation: Orientation,
			eventSocketPath: string,
			volume: number,
		) {
			const windowCoords = getVideoWindowArgsString(x, y, width, height);
			const rotationAngle = convertOrientationToRotationAngle(orientation).toString();

			return spawnApiCommandChildProcess(
				'stream',
				'init',
				[
					windowCoords,
					rotationAngle,
					eventSocketPath,
					filePath,
					volume.toString(10),
				],
			);
		},

		async playStream(streamProcess: ChildProcess) {
			await execApiCommand('stream', 'play', [streamProcess.pid.toString()]);
		},

		async stopStream(streamProcess: ChildProcess) {
			await this.stopVideo(streamProcess);
		},
	};
}

function getVideoWindowArgsString(x: number, y: number, width: number, height: number) {
	return `${x},${y},${x + width},${y + height}`;
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
