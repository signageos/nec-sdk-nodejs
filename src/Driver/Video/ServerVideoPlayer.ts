import Orientation from '@signageos/front-display/es6/NativeDevice/Orientation';
import IVideo from '@signageos/front-display/es6/Video/IVideo';
import IServerVideoPlayer from './IServerVideoPlayer';
import IServerVideo from './IServerVideo';
import { EventEmitter } from "events";

export default class ServerVideoPlayer implements IServerVideoPlayer {

	private videos: IServerVideo[] = [];

	constructor(
		supportedVideosCount: number,
		createVideo: (key: string) => IServerVideo,
	) {
		for (let i = 0; i < supportedVideosCount; i++) {
			const video = createVideo('video_' + i);
			this.videos.push(video);
		}
	}

	public async initialize() {
		await Promise.all(
			this.videos.map((video: IServerVideo) => video.initialize()),
		);
	}

	public async prepare(
		uri: string,
		x: number,
		y: number,
		width: number,
		height: number,
		orientation: Orientation,
		isStream: boolean,
	): Promise<void> {
		const idleVideo = this.getIdleVideoOrThrowException();
		await idleVideo.prepare(uri, x, y, width, height, orientation, isStream);
	}

	public async play(
		uri: string,
		x: number,
		y: number,
		width: number,
		height: number,
		orientation: Orientation,
		isStream: boolean,
	): Promise<IVideo> {
		let video: IServerVideo;
		try {
			video = this.getVideoByArgumentsOrThrowException(uri, x, y, width, height);
		} catch (error) {
			video = this.getIdleVideoOrThrowException();
			await video.prepare(uri, x, y, width, height, orientation, isStream);
		}

		await video.play();
		return this.createVideoEventEmitter(video);
	}

	public async stop(uri: string, x: number, y: number, width: number, height: number): Promise<void> {
		const video = this.getVideoByArgumentsOrThrowException(uri, x, y, width, height);
		await video.stop();
		video.removeAllListeners();
	}

	public async pause(_uri: string, _x: number, _y: number, _width: number, _height: number): Promise<void> {
		throw new Error('Not implemented yet'); // TODO
	}

	public async resume(_uri: string, _x: number, _y: number, _width: number, _height: number): Promise<void> {
		throw new Error('Not implemented yet'); // TODO
	}

	public async clearAll(): Promise<void> {
		await Promise.all(
			this.videos.map(async (video: IServerVideo) => {
				try {
					await video.stop();
				} catch (error) {
					// do nothing
				}
			}),
		);
	}

	private getIdleVideoOrThrowException() {
		for (let video of this.videos) {
			if (video.isIdle()) {
				return video;
			}
		}

		throw new Error('All available video players are busy');
	}

	private getVideoByArgumentsOrThrowException(uri: string, x: number, y: number, width: number, height: number) {
		for (let video of this.videos) {
			const videoArguments = video.getVideoArguments();
			if (videoArguments &&
				videoArguments.uri === uri &&
				videoArguments.x === x &&
				videoArguments.y === y &&
				videoArguments.width === width &&
				videoArguments.height === height
			) {
				return video;
			}
		}

		throw new Error('Video with arguments ' + JSON.stringify({ uri, x, y, width, height }) + ' not found');
	}

	private createVideoEventEmitter(video: IServerVideo): IVideo {
		const videoEventEmitter = new EventEmitter();
		const videoEvent = {
			srcArguments: video.getVideoArguments(),
		};
		video.addEventListener('ended', () => {
			videoEventEmitter.emit('ended', { type: 'ended', ...videoEvent });
		});
		video.addEventListener('error', () => {
			videoEventEmitter.emit('error', { type: 'error', ...videoEvent });
		});
		video.addEventListener('stopped', () => {
			videoEventEmitter.emit('stopped', { type: 'stopped', ...videoEvent });
		});

		return videoEventEmitter;
	}
}
