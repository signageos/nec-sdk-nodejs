import IServerVideoPlayer from './IServerVideoPlayer';
import IServerVideo from './IServerVideo';
import { EventEmitter } from "events";
import IVideoEvent from '@signageos/front-display/es6/Video/IVideoEvent';
import { IOptions } from '@signageos/front-display/es6/Video/IVideoPlayer';

export default class ServerVideoPlayer implements IServerVideoPlayer {

	private videos: IServerVideo[] = [];
	private eventEmitter: EventEmitter;

	constructor(
		supportedVideosCount: number,
		createVideo: (key: string) => IServerVideo,
	) {
		for (let i = 0; i < supportedVideosCount; i++) {
			const video = createVideo('video_' + i);
			this.videos.push(video);
		}
		this.eventEmitter = new EventEmitter();
		// do nothing, just prevent throwing error, if there are no other listeners on "error" event
		this.eventEmitter.on('error', () => { /* do nothing */ });
		this.forwardVideoEventsToSingleOwnEventEmitter();
	}

	public async initialize() {
		await Promise.all(
			this.videos.map((video: IServerVideo) => video.initialize()),
		);
	}

	public async close() {
		console.log('closing video player');
		await Promise.all(
			this.videos.map((video: IServerVideo) => video.close()),
		);
	}

	public async prepare(
		uri: string,
		x: number,
		y: number,
		width: number,
		height: number,
		isStream: boolean,
		options: IOptions = {},
	): Promise<void> {
		const idleVideo = this.getIdleVideoOrThrowException();
		await idleVideo.prepare(uri, x, y, width, height, isStream, options);
	}

	public async play(
		uri: string,
		x: number,
		y: number,
		width: number,
		height: number,
		isStream: boolean,
	): Promise<void> {
		let video: IServerVideo;
		try {
			video = this.getVideoByArgumentsOrThrowException(uri, x, y, width, height);
		} catch (error) {
			video = this.getIdleVideoOrThrowException();
			await video.prepare(uri, x, y, width, height, isStream, {});
		}

		await video.play();
	}

	public async stop(uri: string, x: number, y: number, width: number, height: number): Promise<void> {
		const video = this.getVideoByArguments(uri, x, y, width, height);
		if (video) {
			await video.stop();
		}
	}

	public async pause(uri: string, x: number, y: number, width: number, height: number): Promise<void> {
		const video = this.getVideoByArguments(uri, x, y, width, height);
		if (video) {
			await video.pause();
		}
	}

	public async resume(uri: string, x: number, y: number, width: number, height: number): Promise<void> {
		const video = this.getVideoByArguments(uri, x, y, width, height);
		if (video) {
			await video.resume();
		}
	}

	public addEventListener(event: string, listener: (event: IVideoEvent) => void): void {
		this.eventEmitter.addListener(event, listener);
	}

	public removeEventListener(event: string, listener: (event: IVideoEvent) => void): void {
		this.eventEmitter.removeListener(event, listener);
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

	private getVideoByArguments(uri: string, x: number, y: number, width: number, height: number): IServerVideo | null {
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

		return null;
	}

	private getVideoByArgumentsOrThrowException(uri: string, x: number, y: number, width: number, height: number) {
		const video = this.getVideoByArguments(uri, x, y, width, height);
		if (video) {
			return video;
		} else {
			throw new Error('Video with arguments ' + JSON.stringify({ uri, x, y, width, height }) + ' not found');
		}
	}

	private forwardVideoEventsToSingleOwnEventEmitter() {
		for (let video of this.videos) {
			for (let eventName of ['ended', 'stopped', 'error']) {
				video.addEventListener(eventName, (event: IVideoEvent) => {
					this.eventEmitter.emit(eventName, event);
				});
			}
		}
	}
}
