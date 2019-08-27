import { EventEmitter } from "events";
import * as AsyncLock from 'async-lock';
import BridgeVideoClient from '../../../src/Bridge/BridgeVideoClient';
import {
	PlayVideo,
	PrepareVideo,
	StopVideo,
	VideoError,
	VideoPrepared,
	VideoStarted,
	VideoStopped,
} from '../../../src/Bridge/bridgeVideoMessages';

describe('Bridge.BridgeVideoClient', function () {

	describe('prepareVideo', function () {

		it('should send PrepareVideo event to server and resolve when server sends event VideoPrepared back', async function () {
			const lock = new AsyncLock();
			const socketClient = new EventEmitter();
			const bridgeVideoClient = new BridgeVideoClient(lock, socketClient as any);

			const promisePrepareVideoEmitted = new Promise<void>((resolve: () => void, reject: () => void) => {
				socketClient.on(PrepareVideo, (event: PrepareVideo) => {
					if (event.uri === 'video1' && event.x === 0 && event.y === 0 && event.width === 1920 && event.height === 1080) {
						resolve();
					} else {
						reject();
					}
				});
			});

			const promisePrepareVideo = bridgeVideoClient.prepareVideo('video1', 0, 0, 1920, 1080, false);
			await promisePrepareVideoEmitted;

			socketClient.emit(VideoPrepared, {
				type: VideoPrepared,
				uri: 'video1',
				x: 0,
				y: 0,
				width: 1920,
				height: 1080,
			} as VideoPrepared);

			await promisePrepareVideo;
		});

		it('should send PrepareVideo event to server and reject when server sends event VideoError back', async function () {
			const lock = new AsyncLock();
			const socketClient = new EventEmitter();
			const bridgeVideoClient = new BridgeVideoClient(lock, socketClient as any);

			const promisePrepareVideoEmitted = new Promise<void>((resolve: () => void, reject: () => void) => {
				socketClient.on(PrepareVideo, (event: PrepareVideo) => {
					if (event.uri === 'video1' && event.x === 0 && event.y === 0 && event.width === 1920 && event.height === 1080) {
						resolve();
					} else {
						reject();
					}
				});
			});

			const promisePrepareVideo = bridgeVideoClient.prepareVideo('video1', 0, 0, 1920, 1080, false);
			await promisePrepareVideoEmitted;

			socketClient.emit(VideoError, {
				type: VideoError,
				uri: 'video1',
				x: 0,
				y: 0,
				width: 1920,
				height: 1080,
			} as VideoError);

			await promisePrepareVideo.should.be.rejected();
		});
	});

	describe('prepareVideo', function () {

		it(
			'should send PlayVideo event to server and resolve when server sends event VideoStarted and return event emitter',
			async function () {
				const lock = new AsyncLock();
				const socketClient = new EventEmitter();
				const bridgeVideoClient = new BridgeVideoClient(lock, socketClient as any);

				const promisePlayVideoEmitted = new Promise<void>((resolve: () => void, reject: () => void) => {
					socketClient.on(PlayVideo, (event: PlayVideo) => {
						if (event.uri === 'video1' && event.x === 0 && event.y === 0 && event.width === 1920 && event.height === 1080) {
							resolve();
						} else {
							reject();
						}
					});
				});

				const promisePlayVideo = bridgeVideoClient.playVideo('video1', 0, 0, 1920, 1080, false);
				await promisePlayVideoEmitted;

				socketClient.emit(VideoStarted, {
					type: VideoStarted,
					uri: 'video1',
					x: 0,
					y: 0,
					width: 1920,
					height: 1080,
				} as VideoStarted);

				const videoEventEmitter = await promisePlayVideo;
				videoEventEmitter.should.be.instanceOf(EventEmitter);
			},
		);

		it('should send PlayVideo event to server and reject when server sends event VideoError', async function () {
			const lock = new AsyncLock();
			const socketClient = new EventEmitter();
			const bridgeVideoClient = new BridgeVideoClient(lock, socketClient as any);

			const promisePlayVideoEmitted = new Promise<void>((resolve: () => void, reject: () => void) => {
				socketClient.on(PlayVideo, (event: PlayVideo) => {
					if (event.uri === 'video1' && event.x === 0 && event.y === 0 && event.width === 1920 && event.height === 1080) {
						resolve();
					} else {
						reject();
					}
				});
			});

			const promisePlayVideo = bridgeVideoClient.playVideo('video1', 0, 0, 1920, 1080, false);
			await promisePlayVideoEmitted;

			socketClient.emit(VideoError, {
				type: VideoError,
				uri: 'video1',
				x: 0,
				y: 0,
				width: 1920,
				height: 1080,
			} as VideoError);

			await promisePlayVideo.should.be.rejected();
		});
	});

	describe('stopVideo', function () {

		async function playVideo(
			bridgeVideoClient: BridgeVideoClient,
			socketClient: EventEmitter,
			uri: string,
			x: number,
			y: number,
			width: number,
			height: number,
		) {
			const promisePlayVideoEmitted = new Promise<void>((resolve: () => void, reject: () => void) => {
				socketClient.on(PlayVideo, (event: PlayVideo) => {
					if (event.uri === uri &&
						event.x === x &&
						event.y === y &&
						event.width === width &&
						event.height === height
					) {
						resolve();
					} else {
						console.error('Unexpected event during video play', event);
						reject();
					}
				});
			});

			const promisePlayVideo = bridgeVideoClient.playVideo(uri, x, y, width, height, false);
			await promisePlayVideoEmitted;
			socketClient.emit(VideoStarted, { type: VideoStarted, uri, x, y, width, height } as VideoStarted);
			return await promisePlayVideo;
		}

		it('should send StopVideo event to server and resolve when server sends event VideoStopped', async function () {
			const lock = new AsyncLock();
			const socketClient = new EventEmitter();
			const bridgeVideoClient = new BridgeVideoClient(lock, socketClient as any);

			await playVideo(bridgeVideoClient, socketClient, 'video1', 0, 0, 1920, 1080);

			const promiseStopVideoEmitted = new Promise<void>((resolve: () => void, reject: () => void) => {
				socketClient.on(StopVideo, (event: StopVideo) => {
					if (event.uri === 'video1' && event.x === 0 && event.y === 0 && event.width === 1920 && event.height === 1080) {
						resolve();
					} else {
						reject();
					}
				});
			});

			const promiseStopVideo = bridgeVideoClient.stopVideo('video1', 0, 0, 1920, 1080);
			await promiseStopVideoEmitted;

			socketClient.emit(VideoStopped, {
				type: VideoStopped,
				uri: 'video1',
				x: 0,
				y: 0,
				width: 1920,
				height: 1080,
			} as VideoStopped);

			await promiseStopVideo;
		});

		it('should send StopVideo event to server and reject when server sends event VideoError', async function () {
			const lock = new AsyncLock();
			const socketClient = new EventEmitter();
			const bridgeVideoClient = new BridgeVideoClient(lock, socketClient as any);

			const videoEmitter = await playVideo(bridgeVideoClient, socketClient, 'video1', 0, 0, 1920, 1080);
			videoEmitter.on('error', () => { /* do nothing, this just has to be here so error event doesn't throw error */ });

			const promiseStopVideoEmitted = new Promise<void>((resolve: () => void, reject: () => void) => {
				socketClient.on(StopVideo, (event: StopVideo) => {
					if (event.uri === 'video1' && event.x === 0 && event.y === 0 && event.width === 1920 && event.height === 1080) {
						resolve();
					} else {
						reject();
					}
				});
			});

			const promiseStopVideo = bridgeVideoClient.stopVideo('video1', 0, 0, 1920, 1080);
			await promiseStopVideoEmitted;

			socketClient.emit(VideoError, {
				type: VideoError,
				uri: 'video1',
				x: 0,
				y: 0,
				width: 1920,
				height: 1080,
			} as VideoError);

			await promiseStopVideo.should.be.rejected();
		});
	});
});
