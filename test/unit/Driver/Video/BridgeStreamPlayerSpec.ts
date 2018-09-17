import 'should';
import { EventEmitter } from "events";
import * as AsyncLock from 'async-lock';
import Orientation from '@signageos/front-display/es6/NativeDevice/Orientation';
import IVideoEvent from '@signageos/front-display/es6/Video/IVideoEvent';
import StreamProtocol from '@signageos/front-display/es6/Stream/StreamProtocol';
import BridgeVideoClient from '../../../../src/Bridge/BridgeVideoClient';
import {
	PlayVideo,
	StopVideo,
	VideoEnded,
	VideoError,
	VideoStarted,
	VideoStopped,
} from '../../../../src/Bridge/bridgeVideoMessages';
import BridgeStreamPlayer from '../../../../src/Driver/Video/BridgeStreamPlayer';
import { playStream } from './management';

describe('Driver.Video.BridgeStreamPlayer', function () {

	function createMockWindow(): any {
		return {
			innerWidth: 1920,
			innerHeight: 1080,
		};
	}

	function createMockBridge(window: Window, orientation: Orientation, lock: AsyncLock): any {
		const socketClient = new EventEmitter() as any;
		return {
			socketClient,
			video: new BridgeVideoClient(window, () => orientation, lock, socketClient),
		};
	}

	describe('play', function () {

		it('should play stream', async function () {
			const lock = new AsyncLock();
			const window = createMockWindow();
			const bridge = createMockBridge(window, Orientation.LANDSCAPE, lock);
			const socketClient = bridge.socketClient;
			const bridgeStreamPlayer = new BridgeStreamPlayer(lock, bridge);

			const playVideoEmittedPromise = new Promise<void>((resolve: () => void, reject: (error: Error) => void) => {
				socketClient.once(PlayVideo, (event: PlayVideo) => {
					const { uri, x, y, width, height, orientation, isStream } = event;
					if (uri === 'udp://localhost:8003/stream1' &&
						x === 0 &&
						y === 0 &&
						width === 1920 &&
						height === 1080 &&
						orientation === Orientation.LANDSCAPE &&
						isStream
					) {
						resolve();
					} else {
						reject(new Error('Attempt to play video with unexpected arguments'));
					}
				});
			});

			const playStreamPromise = bridgeStreamPlayer.play('udp://localhost:8003/stream1', 0, 0, 1920, 1080, StreamProtocol.UDP);

			await playVideoEmittedPromise;
			socketClient.emit(VideoStarted, { uri: 'udp://localhost:8003/stream1', x: 0, y: 0, width: 1920, height: 1080 });
			await playStreamPromise;
		});

		it('should fail when bridge throws error', async function () {
			const lock = new AsyncLock();
			const window = createMockWindow();
			const bridge = createMockBridge(window, Orientation.LANDSCAPE, lock);
			const socketClient = bridge.socketClient;
			const bridgeStreamPlayer = new BridgeStreamPlayer(lock, bridge);

			const playVideoEmittedPromise = new Promise<void>((resolve: () => void, reject: (error: Error) => void) => {
				socketClient.once(PlayVideo, (event: PlayVideo) => {
					const { uri, x, y, width, height, orientation, isStream } = event;
					if (uri === 'udp://localhost:8003/stream1' &&
						x === 0 &&
						y === 0 &&
						width === 1920 &&
						height === 1080 &&
						orientation === Orientation.LANDSCAPE &&
						isStream
					) {
						resolve();
					} else {
						reject(new Error('Attempt to play video with unexpected arguments'));
					}
				});
			});

			const playStreamPromise = bridgeStreamPlayer.play('udp://localhost:8003/stream1', 0, 0, 1920, 1080, StreamProtocol.UDP);

			await playVideoEmittedPromise;
			socketClient.emit(VideoError, {
				uri: 'udp://localhost:8003/stream1', x: 0, y: 0, width: 1920, height: 1080, data: { message: 'failed' },
			});
			await playStreamPromise.should.be.rejected();
		});

		it('should fail when trying to play the same stream twice', async function () {
			const lock = new AsyncLock();
			const window = createMockWindow();
			const bridge = createMockBridge(window, Orientation.LANDSCAPE, lock);
			const socketClient = bridge.socketClient;
			const bridgeStreamPlayer = new BridgeStreamPlayer(lock, bridge);

			await playStream(
				window,
				bridgeStreamPlayer,
				socketClient,
				'udp://localhost:8003/stream1',
				0,
				0,
				1920,
				1080,
				StreamProtocol.UDP,
				Orientation.LANDSCAPE,
			);

			await bridgeStreamPlayer
				.play('udp://localhost:8003/stream1', 0, 0, 1920, 1080, StreamProtocol.UDP)
				.should.be.rejected();
		});

		it('returns event emitter that emits correct events when they are thrown from bridge socket', async function () {
			const lock = new AsyncLock();
			const window = createMockWindow();
			const bridge = createMockBridge(window, Orientation.LANDSCAPE, lock);
			const socketClient = bridge.socketClient;
			const bridgeStreamPlayer = new BridgeStreamPlayer(lock, bridge);

			const streamEmitter = await playStream(
				window,
				bridgeStreamPlayer,
				socketClient,
				'udp://localhost:8003/stream1',
				0,
				0,
				1920,
				1080,
				StreamProtocol.UDP,
				Orientation.LANDSCAPE,
			);

			async function assertEvent(listenType: string, emitType: string) {
				const eventPromise = new Promise<void>((resolve: () => void, reject: (error: Error) => void) => {
					streamEmitter.once(listenType, (event: IVideoEvent) => {
						if (
							event.type === listenType &&
							JSON.stringify(event.srcArguments) === JSON.stringify({
								uri: 'udp://localhost:8003/stream1', x: 0, y: 0, width: 1920, height: 1080,
							})
						) {
							resolve();
						} else {
							reject(new Error(`Unexpected ${listenType} event args: ` + JSON.stringify(event)));
						}
					});
				});
				socketClient.emit(emitType, { uri: 'udp://localhost:8003/stream1', x: 0, y: 0, width: 1920, height: 1080 });
				await eventPromise;
			}

			await assertEvent('ended', VideoEnded);
			await assertEvent('error', VideoError);
		});

		it(
			'returns event emitter that emits correct events when they are thrown from bridge socket and converts coordinates back',
			async function () {
				const lock = new AsyncLock();
				const window = createMockWindow();
				const bridge = createMockBridge(window, Orientation.PORTRAIT, lock);
				const socketClient = bridge.socketClient;
				const bridgeStreamPlayer = new BridgeStreamPlayer(lock, bridge);

				const streamEmitter = await playStream(
					window,
					bridgeStreamPlayer,
					socketClient,
					'udp://localhost:8003/stream1',
					200,
					100,
					800,
					600,
					StreamProtocol.UDP,
					Orientation.PORTRAIT,
				);

				async function assertEvent(listenType: string, emitType: string) {
					const eventPromise = new Promise<void>((resolve: () => void, reject: (error: Error) => void) => {
						streamEmitter.once(listenType, (event: IVideoEvent) => {
							if (
								event.type === listenType &&
								JSON.stringify(event.srcArguments) === JSON.stringify({
									uri: 'udp://localhost:8003/stream1', x: 200, y: 100, width: 800, height: 600,
								})
							) {
								resolve();
							} else {
								reject(new Error(`Unexpected ${listenType} event args: ` + JSON.stringify(event)));
							}
						});
					});
					socketClient.emit(emitType, { uri: 'udp://localhost:8003/stream1', x: 1220, y: 200, width: 600, height: 800 });
					await eventPromise;
				}

				await assertEvent('ended', VideoEnded);
				await assertEvent('error', VideoError);
			},
		);

		it('should fail for unsupported protocol', async function () {
			const lock = new AsyncLock();
			const window = createMockWindow();
			const bridge = createMockBridge(window, Orientation.LANDSCAPE, lock);
			const bridgeStreamPlayer = new BridgeStreamPlayer(lock, bridge);

			await bridgeStreamPlayer
				.play('rtp://localhost:8003/stream1', 0, 0, 1920, 1080, StreamProtocol.RTP)
				.should.be.rejected();
		});
	});

	describe('stop', function () {

		it('should stop stream', async function () {
			const lock = new AsyncLock();
			const window = createMockWindow();
			const bridge = createMockBridge(window, Orientation.LANDSCAPE, lock);
			const socketClient = bridge.socketClient;
			const bridgeStreamPlayer = new BridgeStreamPlayer(lock, bridge);

			await playStream(
				window,
				bridgeStreamPlayer,
				socketClient,
				'udp://localhost:8003/stream1',
				0,
				0,
				1920,
				1080,
				StreamProtocol.UDP,
				Orientation.LANDSCAPE,
			);

			const stopVideoEmittedPromise = new Promise<void>((resolve: () => void, reject: (error: Error) => void) => {
				socketClient.once(StopVideo, (event: StopVideo) => {
					const { uri, x, y, width, height } = event;
					if (uri === 'udp://localhost:8003/stream1' && x === 0 && y === 0 && width === 1920 && height === 1080) {
						resolve();
					} else {
						reject(new Error('Attempt to play video with unexpected arguments'));
					}
				});
			});

			const stopStreamPromise = bridgeStreamPlayer.stop('udp://localhost:8003/stream1', 0, 0, 1920, 1080);
			await stopVideoEmittedPromise;
			socketClient.emit(VideoStopped, { uri: 'udp://localhost:8003/stream1', x: 0, y: 0, width: 1920, height: 1080 });
			await stopStreamPromise;
		});

		it('should resolve even if bridge throws error because either way stream stopped playing', async function () {
			const lock = new AsyncLock();
			const window = createMockWindow();
			const bridge = createMockBridge(window, Orientation.LANDSCAPE, lock);
			const socketClient = bridge.socketClient;
			const bridgeStreamPlayer = new BridgeStreamPlayer(lock, bridge);

			await playStream(
				window,
				bridgeStreamPlayer,
				socketClient,
				'udp://localhost:8003/stream1',
				0,
				0,
				1920,
				1080,
				StreamProtocol.UDP,
				Orientation.LANDSCAPE,
			);

			const stopVideoEmittedPromise = new Promise<void>((resolve: () => void, reject: (error: Error) => void) => {
				socketClient.once(StopVideo, (event: { uri: string; x: number; y: number; width: number; height: number }) => {
					const { uri, x, y, width, height } = event;
					if (uri === 'udp://localhost:8003/stream1' && x === 0 && y === 0 && width === 1920 && height === 1080) {
						resolve();
					} else {
						reject(new Error('Attempt to play video with unexpected arguments'));
					}
				});
			});

			const stopStreamPromise = bridgeStreamPlayer.stop('udp://localhost:8003/stream1', 0, 0, 1920, 1080);
			await stopVideoEmittedPromise;
			socketClient.emit(VideoError, {
				uri: 'udp://localhost:8003/stream1',
				x: 0,
				y: 0,
				width: 1920,
				height: 1080,
				data: { message: 'failed' },
			});
			await stopStreamPromise;
		});

		it('should fail for non-playing stream', async function () {
			const lock = new AsyncLock();
			const window = createMockWindow();
			const bridge = createMockBridge(window, Orientation.LANDSCAPE, lock);
			const bridgeStreamPlayer = new BridgeStreamPlayer(lock, bridge);
			await bridgeStreamPlayer.stop('udp://localhost:8003/stream1', 0, 0, 1920, 1080).should.be.rejected();
		});
	});
});
