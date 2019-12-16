import { ChildProcess } from 'child_process';
import {
	execApiCommand,
	spawnApiCommandChildProcess,
} from './apiCommand';
import Orientation from '@signageos/front-display/es6/NativeDevice/Orientation';
import { SECOND_IN_MS } from '@signageos/lib/dist/DateTime/millisecondConstants';

export type IResolution = {
	width: number;
	height: number;
};

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
	pauseVideo(videoProcess: ChildProcess): Promise<void>;
	resumeVideo(videoProcess: ChildProcess): Promise<void>;
	stopVideo(videoProcess: ChildProcess): Promise<void>;
	getVideoDurationMs(filePath: string): Promise<number>;
	getVideoResolution(filePath: string): Promise<IResolution>;
	getVideoFramerate(filePath: string): Promise<number>;
	getVideoBitrate(filePath: string): Promise<number>;
	getVideoCodec(filePath: string): Promise<string>;
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
	pauseStream(streamProcess: ChildProcess): Promise<void>;
	resumeStream(streamProcess: ChildProcess): Promise<void>;
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

		async pauseVideo(videoProcess: ChildProcess): Promise<void> {
			await execApiCommand('video', 'pause', [videoProcess.pid.toString()]);
		},

		async resumeVideo(videoProcess: ChildProcess): Promise<void> {
			await execApiCommand('video', 'resume', [videoProcess.pid.toString()]);
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

		async getVideoResolution(filePath: string): Promise<IResolution> {
			const resolutionString = await execApiCommand('video', 'resolution', [filePath]);
			const [widthString, heightString] = resolutionString.split('x');
			const width = parseFloat(widthString);
			const height = parseFloat(heightString);
			if (isNaN(width) || isNaN(height)) {
				throw new Error('Failed to get video resolution, got NaN');
			}
			return { width, height };
		},

		async getVideoFramerate(filePath: string): Promise<number> {
			const framerateString = await execApiCommand('video', 'framerate', [filePath]);
			const [highString, lowString] = framerateString.split('/');
			const high = parseFloat(highString);
			const low = parseFloat(lowString);
			if (isNaN(high) || isNaN(low)) {
				throw new Error('Failed to get video framerate, got NaN');
			}
			return Math.round(high / low);
		},

		async getVideoBitrate(filePath: string): Promise<number> {
			const bitrateString = await execApiCommand('video', 'bitrate', [filePath]);
			const bitrate = parseFloat(bitrateString);
			if (isNaN(bitrate)) {
				throw new Error('Failed to get video bitrate, got NaN');
			}
			return Math.trunc(bitrate);
		},

		async getVideoCodec(filePath: string): Promise<string> {
			const codec = await execApiCommand('video', 'codec', [filePath]);
			if (!codec) {
				throw new Error('Failed to get video codec, got NaN');
			}
			return codec.trim();
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

		async pauseStream(streamProcess: ChildProcess): Promise<void> {
			await execApiCommand('stream', 'pause', [streamProcess.pid.toString()]);
		},

		async resumeStream(streamProcess: ChildProcess): Promise<void> {
			await execApiCommand('stream', 'resume', [streamProcess.pid.toString()]);
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
			return 270;
		case Orientation.LANDSCAPE_FLIPPED:
			return 180;
		case Orientation.PORTRAIT_FLIPPED:
			return 90;
		default:
			return 0;
	}
}
