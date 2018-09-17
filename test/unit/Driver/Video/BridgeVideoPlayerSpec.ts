import 'should';
import { EventEmitter } from 'events';
import * as sinon from 'sinon';
import * as AsyncLock from 'async-lock';
import {
	PlayVideo,
	PrepareVideo,
	StopVideo,
	VideoEnded,
	VideoError,
	VideoPrepared,
	VideoStarted,
	VideoStopped,
} from '../../../../src/Bridge/bridgeVideoMessages';
import BridgeVideoPlayer from '../../../../src/Driver/Video/BridgeVideoPlayer';
import IVideoEvent from '../../../../node_modules/@signageos/front-display/es6/Video/IVideoEvent';
import { checksumString } from '@signageos/front-display/es6/Hash/checksum';
import Orientation from '@signageos/front-display/es6/NativeDevice/Orientation';
import BridgeVideoClient from '../../../../src/Bridge/BridgeVideoClient';
import {
	playVideo,
	prepareVideo,
} from './management';

describe('Driver.Video.BridgeVideoPlayer', function () {

	function createMockWindow(): any {
		const elements: any[] = [
			{
				name: 'div',
				id: 'body',
				appendChild: sinon.spy(),
				removeChild: sinon.spy(),
			},
		];

		return {
			innerWidth: 1920,
			innerHeight: 1080,
			document: {
				getElementById(id: string) {
					for (let element of elements) {
						if (element.id === id) {
							return element;
						}
					}

					return null;
				},
				createElement: (name: string) => {
					const element = { name, style: {} };
					elements.push(element);
					return element;
				},
			},
		};
	}

	function createMockBridge(window: Window, orientation: Orientation, lock: AsyncLock): any {
		const socketClient = new EventEmitter() as any;
		return {
			socketClient,
			video: new BridgeVideoClient(window, () => orientation, lock, socketClient),
		};
	}

	describe('prepare', function () {

		it('should resolve', async function () {
			const window = createMockWindow();
			const lock = new AsyncLock();
			const bridge = createMockBridge(window, Orientation.LANDSCAPE, lock);
			const socketClient = bridge.socketClient;

			const prepareVideoEmittedPromise = new Promise<void>((resolve: () => void, reject: (error: Error) => void) => {
				socketClient.once(PrepareVideo, (event: { uri: string; x: number; y: number; width: number; height: number }) => {
					const { uri, x, y, width, height } = event;
					if (uri === 'video1' && x === 0 && y === 0 && width === 1920 && height === 1080) {
						resolve();
					} else {
						reject(new Error('Attempt to prepare video with unexpected arguments'));
					}
				});
			});

			const bridgeVideoPlayer = new BridgeVideoPlayer(window, 'http://localhost:8081', lock, bridge as any);
			const prepareVideoPromise = bridgeVideoPlayer.prepare('http://localhost:8081/video1', 0, 0, 1920, 1080);

			await prepareVideoEmittedPromise;
			socketClient.emit(VideoPrepared, { uri: 'video1', x: 0, y: 0, width: 1920, height: 1080 });
			await prepareVideoPromise;
		});

		it('should fail when bridge throws an error', async function () {
			const window = createMockWindow();
			const lock = new AsyncLock();
			const bridge = createMockBridge(window, Orientation.LANDSCAPE, lock);
			const socketClient = bridge.socketClient;

			const prepareVideoEmittedPromise = new Promise<void>((resolve: () => void, reject: (error: Error) => void) => {
				socketClient.once(PrepareVideo, (event: { uri: string; x: number; y: number; width: number; height: number }) => {
					const { uri, x, y, width, height } = event;
					if (uri === 'video1' && x === 0 && y === 0 && width === 1920 && height === 1080) {
						resolve();
					} else {
						reject(new Error('Attempt to prepare video with unexpected arguments'));
					}
				});
			});

			const bridgeVideoPlayer = new BridgeVideoPlayer(window, 'http://localhost:8081', lock, bridge as any);
			const prepareVideoPromise = bridgeVideoPlayer.prepare('http://localhost:8081/video1', 0, 0, 1920, 1080);

			await prepareVideoEmittedPromise;
			socketClient.emit(VideoError, { uri: 'video1', x: 0, y: 0, width: 1920, height: 1080, data: { message: 'failed' } });
			await prepareVideoPromise.should.be.rejected();
		});
	});

	describe('play', function () {

		it('should resolve and append last frame img element to body', async function () {
			const window = createMockWindow();
			const lock = new AsyncLock();
			const bridge = createMockBridge(window, Orientation.LANDSCAPE, lock);
			const socketClient = bridge.socketClient;
			const bridgeVideoPlayer = new BridgeVideoPlayer(window, 'http://localhost:8081', lock, bridge as any);

			await prepareVideo(window, bridgeVideoPlayer, socketClient, 'http://localhost:8081/video1', 'video1', 0, 0, 1920, 1080);

			const playVideoEmittedPromise = new Promise<void>((resolve: () => void, reject: (error: Error) => void) => {
				socketClient.once(PlayVideo, (event: PlayVideo) => {
					const { uri, x, y, width, height, orientation, isStream } = event;
					if (uri === 'video1' &&
						x === 0 &&
						y === 0 &&
						width === 1920 &&
						height === 1080 &&
						orientation === Orientation.LANDSCAPE &&
						!isStream
					) {
						resolve();
					} else {
						reject(new Error('Attempt to play video with unexpected arguments'));
					}
				});
			});

			const playVideoPromise = bridgeVideoPlayer.play('http://localhost:8081/video1', 0, 0, 1920, 1080);

			await playVideoEmittedPromise;
			socketClient.emit(VideoStarted, { uri: 'video1', x: 0, y: 0, width: 1920, height: 1080 });
			await playVideoPromise;

			const body = window.document.getElementById('body');
			body.appendChild.callCount.should.equal(1);
			body.appendChild.getCall(0).args[0].should.deepEqual({
				name: 'div',
				id: checksumString('http://localhost:8081/video1') + '_0x0-1920x1080',
				style: {
					position: 'absolute',
					left: '0px',
					top: '0px',
					width: '1920px',
					height: '1080px',
					backgroundImage: 'url(http://localhost:8081/video1.last_frame.bmp)',
					backgroundRepeat: 'no-repeat',
					backgroundSize: 'contain',
					backgroundPosition: 'center',
					visibility: 'visible',
				},
			});
		});

		it('should fail when bridge throws error', async function () {
			const window = createMockWindow();
			const lock = new AsyncLock();
			const bridge = createMockBridge(window, Orientation.LANDSCAPE, lock);
			const socketClient = bridge.socketClient;
			const bridgeVideoPlayer = new BridgeVideoPlayer(window, 'http://localhost:8081', lock, bridge as any);

			await prepareVideo(window, bridgeVideoPlayer, socketClient, 'http://localhost:8081/video1', 'video1', 0, 0, 1920, 1080);

			const playVideoEmittedPromise = new Promise<void>((resolve: () => void, reject: (error: Error) => void) => {
				socketClient.once(PlayVideo, (event: PlayVideo) => {
					const { uri, x, y, width, height, orientation, isStream } = event;
					if (uri === 'video1' &&
						x === 0 &&
						y === 0 &&
						width === 1920 &&
						height === 1080 &&
						orientation === Orientation.LANDSCAPE &&
						!isStream
					) {
						resolve();
					} else {
						reject(new Error('Attempt to play video with unexpected arguments'));
					}
				});
			});

			const playVideoPromise = bridgeVideoPlayer.play('http://localhost:8081/video1', 0, 0, 1920, 1080);

			await playVideoEmittedPromise;
			socketClient.emit(VideoError, { uri: 'video1', x: 0, y: 0, width: 1920, height: 1080, data: { message: 'failed' } });
			await playVideoPromise.should.be.rejected();
		});

		it('should fail when trying to play same video twice', async function () {
			const window = createMockWindow();
			const lock = new AsyncLock();
			const bridge = createMockBridge(window, Orientation.LANDSCAPE, lock);
			const socketClient = bridge.socketClient;
			const bridgeVideoPlayer = new BridgeVideoPlayer(window, 'http://localhost:8081', lock, bridge as any);

			await playVideo(
				window,
				bridgeVideoPlayer,
				socketClient,
				'http://localhost:8081/video1',
				'video1',
				0,
				0,
				1920,
				1080,
				Orientation.LANDSCAPE,
			);
			await bridgeVideoPlayer.play('http://localhost:8081/video1', 0, 0, 1920, 1080).should.be.rejected();
		});

		it('returns event emitter that emits correct events when they are thrown from bridge socket', async function () {
			const window = createMockWindow();
			const lock = new AsyncLock();
			const bridge = createMockBridge(window, Orientation.LANDSCAPE, lock);
			const socketClient = bridge.socketClient;
			const bridgeVideoPlayer = new BridgeVideoPlayer(window, 'http://localhost:8081', lock, bridge as any);

			const videoEmitter = await playVideo(
				window,
				bridgeVideoPlayer,
				socketClient,
				'http://localhost:8081/video1',
				'video1',
				0,
				0,
				1920,
				1080,
				Orientation.LANDSCAPE,
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

		it(
			'returns event emitter that emits correct events when they are thrown from bridge socket and converts coordinates back',
			async function () {
				const window = createMockWindow();
				const lock = new AsyncLock();
				const bridge = createMockBridge(window, Orientation.PORTRAIT, lock);
				const socketClient = bridge.socketClient;
				const bridgeVideoPlayer = new BridgeVideoPlayer(window, 'http://localhost:8081', lock, bridge as any);

				const videoEmitter = await playVideo(
					window,
					bridgeVideoPlayer,
					socketClient,
					'http://localhost:8081/video1',
					'video1',
					200,
					100,
					800,
					600,
					Orientation.PORTRAIT,
				);

				async function assertEvent(listenType: string, emitType: string) {
					const eventPromise = new Promise<void>((resolve: () => void, reject: (error: Error) => void) => {
						videoEmitter.once(listenType, (event: IVideoEvent) => {
							if (
								event.type === listenType &&
								JSON.stringify(event.srcArguments) === JSON.stringify({
									uri: 'http://localhost:8081/video1', x: 200, y: 100, width: 800, height: 600,
								})
							) {
								resolve();
							} else {
								reject(new Error(`Unexpected ${listenType} event args: ` + JSON.stringify(event)));
							}
						});
					});
					socketClient.emit(emitType, { uri: 'video1', x: 1220, y: 200, width: 600, height: 800 });
					await eventPromise;
				}

				await assertEvent('ended', VideoEnded);
				await assertEvent('stopped', VideoStopped);
				await assertEvent('error', VideoError);
			});
	});

	describe('stop', function () {

		it('should stop playing video and remove last frame img element', async function () {
			const window = createMockWindow();
			const lock = new AsyncLock();
			const bridge = createMockBridge(window, Orientation.LANDSCAPE, lock);
			const socketClient = bridge.socketClient;
			const bridgeVideoPlayer = new BridgeVideoPlayer(window, 'http://localhost:8081', lock, bridge as any);

			await playVideo(
				window,
				bridgeVideoPlayer,
				socketClient,
				'http://localhost:8081/video1',
				'video1',
				0,
				0,
				1920,
				1080,
				Orientation.LANDSCAPE,
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

			const body = window.document.getElementById('body');
			body.removeChild.callCount.should.equal(1);
			body.removeChild.getCall(0).args[0].should.deepEqual({
				name: 'div',
				id: checksumString('http://localhost:8081/video1') + '_0x0-1920x1080',
				style: {
					position: 'absolute',
					left: '0px',
					top: '0px',
					width: '1920px',
					height: '1080px',
					backgroundImage: 'url(http://localhost:8081/video1.last_frame.bmp)',
					backgroundRepeat: 'no-repeat',
					backgroundSize: 'contain',
					backgroundPosition: 'center',
					visibility: 'visible',
				},
			});
		});

		it('should resolve even if bridge throws error because either way video stopped playing', async function () {
			const window = createMockWindow();
			const lock = new AsyncLock();
			const bridge = createMockBridge(window, Orientation.LANDSCAPE, lock);
			const socketClient = bridge.socketClient;
			const bridgeVideoPlayer = new BridgeVideoPlayer(window, 'http://localhost:8081', lock, bridge as any);

			await playVideo(
				window,
				bridgeVideoPlayer,
				socketClient,
				'http://localhost:8081/video1',
				'video1',
				0,
				0,
				1920,
				1080,
				Orientation.LANDSCAPE,
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
			const window = createMockWindow();
			const lock = new AsyncLock();
			const bridge = createMockBridge(window, Orientation.LANDSCAPE, lock);
			const bridgeVideoPlayer = new BridgeVideoPlayer(window, 'http://localhost:8081', lock, bridge as any);
			await bridgeVideoPlayer.stop('http://localhost:8081/video1', 0, 0, 1920, 1080).should.be.rejected();
		});
	});
});
