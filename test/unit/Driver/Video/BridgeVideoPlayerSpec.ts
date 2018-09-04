import 'should';
import { EventEmitter } from 'events';
import * as AsyncLock from 'async-lock';
import {
	PlayVideo,
	StopVideo,
	StopAllVideos,
	VideoStarted,
	VideoEnded,
	VideoStopped,
	VideoError,
	AllVideosStopped,
} from '../../../../src/Bridge/bridgeVideoMessages';
import BridgeVideoPlayer from '../../../../src/Driver/Video/BridgeVideoPlayer';
import IVideoEvent from '../../../../node_modules/@signageos/front-display/es6/Video/IVideoEvent';

describe('Driver.Video.BridgeVideoPlayer', function () {

	async function playVideo(
		bridgeVideoPlayer: BridgeVideoPlayer,
		socketClient: EventEmitter,
		uri: string,
		uriRelative: string,
		x: number,
		y: number,
		width: number,
		height: number,
	) {
		const playVideoEmittedPromise = new Promise<void>((resolve: () => void, reject: (error: Error) => void) => {
			socketClient.once(PlayVideo, (event: { uri: string; x: number; y: number; width: number; height: number }) => {
				if (event.uri === uriRelative && event.x === x && event.y === y && event.width === width && event.height === height) {
					resolve();
				} else {
					reject(new Error('Attempt to play video with unexpected arguments'));
				}
			});
		});

		const playVideoPromise = bridgeVideoPlayer.play(uri, x, y, width, height);
		await playVideoEmittedPromise;
		socketClient.emit(VideoStarted, { uri: uriRelative, x, y, width, height });
		return await playVideoPromise;
	}

	describe('play', function () {

		it('should resolve', async function () {
			const lock = new AsyncLock();
			const socketClient = new EventEmitter();
			const bridge = { socketClient };

			const playVideoEmittedPromise = new Promise<void>((resolve: () => void, reject: (error: Error) => void) => {
				socketClient.once(PlayVideo, (event: { uri: string; x: number; y: number; width: number; height: number }) => {
					const { uri, x, y, width, height } = event;
					if (uri === 'video1' && x === 0 && y === 0 && width === 1920 && height === 1080) {
						resolve();
					} else {
						reject(new Error('Attempt to play video with unexpected arguments'));
					}
				});
			});

			const bridgeVideoPlayer = new BridgeVideoPlayer('http://localhost:8081', lock, bridge as any);
			const playVideoPromise = bridgeVideoPlayer.play('http://localhost:8081/video1', 0, 0, 1920, 1080);

			await playVideoEmittedPromise;
			socketClient.emit(VideoStarted, { uri: 'video1', x: 0, y: 0, width: 1920, height: 1080 });
			await playVideoPromise;
		});

		it('should fail when bridge throws error', async function () {
			const lock = new AsyncLock();
			const socketClient = new EventEmitter();
			const bridge = { socketClient };

			const playVideoEmittedPromise = new Promise<void>((resolve: () => void, reject: (error: Error) => void) => {
				socketClient.once(PlayVideo, (event: { uri: string; x: number; y: number; width: number; height: number }) => {
					const { uri, x, y, width, height } = event;
					if (uri === 'video1' && x === 0 && y === 0 && width === 1920 && height === 1080) {
						resolve();
					} else {
						reject(new Error('Attempt to play video with unexpected arguments'));
					}
				});
			});

			const bridgeVideoPlayer = new BridgeVideoPlayer('http://localhost:8081', lock, bridge as any);
			const playVideoPromise = bridgeVideoPlayer.play('http://localhost:8081/video1', 0, 0, 1920, 1080);

			await playVideoEmittedPromise;
			socketClient.emit(VideoError, { uri: 'video1', x: 0, y: 0, width: 1920, height: 1080, data: { message: 'failed' } });
			await playVideoPromise.should.be.rejected();
		});

		it('should fail when trying to play same video twice', async function () {
			const lock = new AsyncLock();
			const socketClient = new EventEmitter();
			const bridge = { socketClient };
			const bridgeVideoPlayer = new BridgeVideoPlayer('http://localhost:8081', lock, bridge as any);

			await playVideo(
				bridgeVideoPlayer,
				socketClient,
				'http://localhost:8081/video1',
				'video1',
				0,
				0,
				1920,
				1080,
			);
			await bridgeVideoPlayer.play('http://localhost:8081/video1', 0, 0, 1920, 1080).should.be.rejected();
		});

		it('returns event emitter that emits correct events when they are thrown from bridge socket', async function () {
			const lock = new AsyncLock();
			const socketClient = new EventEmitter();
			const bridge = { socketClient };
			const bridgeVideoPlayer = new BridgeVideoPlayer('http://localhost:8081', lock, bridge as any);

			const videoEmitter = await playVideo(
				bridgeVideoPlayer,
				socketClient,
				'http://localhost:8081/video1',
				'video1',
				0,
				0,
				1920,
				1080,
			);

			async function assertEvent(listenType: string, emitType: string) {
				const eventPromise = new Promise<void>((resolve: () => void, reject: (error: Error) => void) => {
					videoEmitter.once(listenType, (event: IVideoEvent) => {
						if (
							event.type === listenType &&
							JSON.stringify(event.srcArguments) === JSON.stringify({
								uri: 'http://localhost:8081/video1', x: 0, y: 0, width: 1920, height: 1080,
							})
						) {
							resolve();
						} else {
							reject(new Error(`Unexpected ${listenType} event args: ` + JSON.stringify(event)));
						}
					});
				});
				socketClient.emit(emitType, { uri: 'video1', x: 0, y: 0, width: 1920, height: 1080 });
				await eventPromise;
			}

			await assertEvent('ended', VideoEnded);
			await assertEvent('stopped', VideoStopped);
			await assertEvent('error', VideoError);
		});
	});

	describe('stop', function () {

		it('should stop playing video', async function () {
			const lock = new AsyncLock();
			const socketClient = new EventEmitter();
			const bridge = { socketClient };
			const bridgeVideoPlayer = new BridgeVideoPlayer('http://localhost:8081', lock, bridge as any);

			await playVideo(
				bridgeVideoPlayer,
				socketClient,
				'http://localhost:8081/video1',
				'video1',
				0,
				0,
				1920,
				1080,
			);

			const stopVideoEmittedPromise = new Promise<void>((resolve: () => void, reject: (error: Error) => void) => {
				socketClient.once(StopVideo, (event: { uri: string; x: number; y: number; width: number; height: number }) => {
					const { uri, x, y, width, height } = event;
					if (uri === 'video1' && x === 0 && y === 0 && width === 1920 && height === 1080) {
						resolve();
					} else {
						reject(new Error('Attempt to play video with unexpected arguments'));
					}
				});
			});

			const stopVideoPromise = bridgeVideoPlayer.stop('http://localhost:8081/video1', 0, 0, 1920, 1080);
			await stopVideoEmittedPromise;
			socketClient.emit(VideoStopped, { uri: 'video1', x: 0, y: 0, width: 1920, height: 1080 });
			await stopVideoPromise;
		});

		it('should resolve even if bridge throws error because either way video stopped playing', async function () {
			const lock = new AsyncLock();
			const socketClient = new EventEmitter();
			const bridge = { socketClient };
			const bridgeVideoPlayer = new BridgeVideoPlayer('http://localhost:8081', lock, bridge as any);

			await playVideo(
				bridgeVideoPlayer,
				socketClient,
				'http://localhost:8081/video1',
				'video1',
				0,
				0,
				1920,
				1080,
			);

			const stopVideoEmittedPromise = new Promise<void>((resolve: () => void, reject: (error: Error) => void) => {
				socketClient.once(StopVideo, (event: { uri: string; x: number; y: number; width: number; height: number }) => {
					const { uri, x, y, width, height } = event;
					if (uri === 'video1' && x === 0 && y === 0 && width === 1920 && height === 1080) {
						resolve();
					} else {
						reject(new Error('Attempt to play video with unexpected arguments'));
					}
				});
			});

			const stopVideoPromise = bridgeVideoPlayer.stop('http://localhost:8081/video1', 0, 0, 1920, 1080);
			await stopVideoEmittedPromise;
			socketClient.emit(VideoError, { uri: 'video1', x: 0, y: 0, width: 1920, height: 1080, data: { message: 'failed' } });
			await stopVideoPromise;
		});

		it('should fail for non-playing video', async function () {
			const lock = new AsyncLock();
			const socketClient = new EventEmitter();
			const bridge = { socketClient };
			const bridgeVideoPlayer = new BridgeVideoPlayer('http://localhost:8081', lock, bridge as any);

			await bridgeVideoPlayer.stop('http://localhost:8081/video1', 0, 0, 1920, 1080).should.be.rejected();
		});
	});

	describe('clearAll', function () {

		it('should stop all videos', async function () {
			const lock = new AsyncLock();
			const socketClient = new EventEmitter();
			const bridge = { socketClient };
			const bridgeVideoPlayer = new BridgeVideoPlayer('http://localhost:8081', lock, bridge as any);

			const clearAllEmittedPromise = new Promise<void>((resolve: () => void) => socketClient.once(StopAllVideos, resolve));
			const clearAllPromise = bridgeVideoPlayer.clearAll();
			await clearAllEmittedPromise;
			socketClient.emit(AllVideosStopped, {});
			await clearAllPromise;
		});
	});
});
