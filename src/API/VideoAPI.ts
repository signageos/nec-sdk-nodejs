import { ChildProcess } from 'child_process';
import {
	execApiCommand,
	spawnApiCommandChildProcess,
} from './apiCommand';
import Orientation from '@signageos/front-display/es6/NativeDevice/Orientation';
import { SECOND_IN_MS } from '@signageos/lib/dist/DateTime/millisecondConstants';

export type IVideoDetails = {
	width?: number;
	height?: number;
	durationMs?: number;
	framerate?: number;
	bitrate?: number;
	codec?: string;
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
	getVideoDetails(filePath: string): Promise<IVideoDetails>;
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

export class VideoAPI implements IVideoAPI {

	public prepareVideo(
		filePath: string,
		x: number,
		y: number,
		width: number,
		height: number,
		orientation: Orientation,
		eventSocketPath: string,
		volume: number,
	) {
		const windowCoords = this.getVideoWindowArgsString(x, y, width, height);
		const rotationAngle = this.convertOrientationToRotationAngle(orientation).toString();

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
	}

	public async playVideo(videoProcess: ChildProcess) {
		await execApiCommand('video', 'play', [videoProcess.pid.toString()]);
	}

	public async pauseVideo(videoProcess: ChildProcess): Promise<void> {
		await execApiCommand('video', 'pause', [videoProcess.pid.toString()]);
	}

	public async resumeVideo(videoProcess: ChildProcess): Promise<void> {
		await execApiCommand('video', 'resume', [videoProcess.pid.toString()]);
	}

	public async stopVideo(videoProcess: ChildProcess) {
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
	}

	public async getVideoDetails(filePath: string): Promise<IVideoDetails> {
		const videoDetailsRaw = await execApiCommand('video', 'details', [filePath]);
		const videoDetails: IVideoDetails = {};
		for (let line of videoDetailsRaw.split('\n')) {
			const [key, value] = line.split('=');
			switch (key) {
				case 'width':
					const width = parseFloat(value);
					if (!isNaN(width)) {
						videoDetails.width = width;
					}
					break;
				case 'height':
					const height = parseFloat(value);
					if (!isNaN(height)) {
						videoDetails.height = height;
					}
					break;
				case 'duration':
					const durationSec = parseFloat(value);
					if (!isNaN(durationSec)) {
						videoDetails.durationMs = Math.trunc(durationSec * 1000);
					}
					break;
				case 'r_frame_rate':
					const [highString, lowString] = value.split('/');
					const high = parseFloat(highString);
					const low = parseFloat(lowString);
					if (!isNaN(high) && !isNaN(low)) {
						videoDetails.framerate = Math.round(high / low);
					}
					break;
				case 'bit_rate':
					const bitrate = parseFloat(value);
					if (!isNaN(bitrate)) {
						videoDetails.bitrate = Math.trunc(bitrate);
					}
					break;
				case 'codec_name':
					videoDetails.codec = value;
					break;
				default:
					console.warn(`unexpected video details key ${line}`);
			}
		}
		return videoDetails;
	}

	public prepareStream(
		filePath: string,
		x: number,
		y: number,
		width: number,
		height: number,
		orientation: Orientation,
		eventSocketPath: string,
		volume: number,
	) {
		const windowCoords = this.getVideoWindowArgsString(x, y, width, height);
		const rotationAngle = this.convertOrientationToRotationAngle(orientation).toString();

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
	}

	public async playStream(streamProcess: ChildProcess) {
		await execApiCommand('stream', 'play', [streamProcess.pid.toString()]);
	}

	public async pauseStream(streamProcess: ChildProcess): Promise<void> {
		await execApiCommand('stream', 'pause', [streamProcess.pid.toString()]);
	}

	public async resumeStream(streamProcess: ChildProcess): Promise<void> {
		await execApiCommand('stream', 'resume', [streamProcess.pid.toString()]);
	}

	public async stopStream(streamProcess: ChildProcess) {
		await this.stopVideo(streamProcess);
	}

	private getVideoWindowArgsString(x: number, y: number, width: number, height: number) {
		return `${x},${y},${x + width},${y + height}`;
	}

	private convertOrientationToRotationAngle(orientation: Orientation) {
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
}

export function createVideoAPI(): IVideoAPI {
	return new VideoAPI();
}
