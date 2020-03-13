import { EventEmitter } from "events";
import * as should from 'should';
import BridgeVideoClient from '../../../src/Bridge/BridgeVideoClient';
import { PlayVideo, PrepareVideo, StopVideo, StopAllVideos } from '../../../src/Bridge/bridgeVideoMessages';

function createMockBridgeClient(messageCallback: (message: any) => void) {
	return {
		async invoke(message: any) {
			messageCallback(message);
		},
	};
}

describe('Bridge.BridgeVideoClient', function () {

	describe('prepareVideo', function () {

		it('should send PrepareVideo message to server and resolve when server responds successfully', async function () {
			const bridge = createMockBridgeClient((message: PrepareVideo) => {
				should(message).deepEqual(
					{
						type: PrepareVideo,
						uri: 'video1',
						x: 0,
						y: 0,
						width: 1920,
						height: 1080,
						isStream: false,
						options: {},
					},
				);
			});
			const bridgeVideoClient = new BridgeVideoClient(bridge as any, new EventEmitter() as any);
			await bridgeVideoClient.prepareVideo('video1', 0, 0, 1920, 1080, false);
		});

		it('should send PrepareVideo message to server and reject when server rejects', async function () {
			const bridge = createMockBridgeClient((message: PrepareVideo) => {
				if (message.type === PrepareVideo) {
					throw new Error('prepare failed');
				}
			});
			const bridgeVideoClient = new BridgeVideoClient(bridge as any, new EventEmitter() as any);
			await should(bridgeVideoClient.prepareVideo('video1', 0, 0, 1920, 1080, false)).be.rejected();
		});
	});

	describe('playVideo', function () {

		it('should send PlayVideo message to server and resolve when server responds successfully', async function () {
			const bridge = createMockBridgeClient((message: PlayVideo) => {
				should(message).deepEqual(
					{
						type: PlayVideo,
						uri: 'video1',
						x: 0,
						y: 0,
						width: 1920,
						height: 1080,
						isStream: false,
					},
				);
			});
			const bridgeVideoClient = new BridgeVideoClient(bridge as any, new EventEmitter() as any);
			const videoEventEmitter = await bridgeVideoClient.playVideo('video1', 0, 0, 1920, 1080, false);
			videoEventEmitter.should.be.instanceOf(EventEmitter);
		});

		it('should send PlayVideo message to server and reject when server rejects', async function () {
			const bridge = createMockBridgeClient((message: PlayVideo) => {
				if (message.type === PlayVideo) {
					throw new Error('play failed');
				}
			});
			const bridgeVideoClient = new BridgeVideoClient(bridge as any, new EventEmitter() as any);
			await should(bridgeVideoClient.playVideo('video1', 0, 0, 1920, 1080, false)).be.rejected();
		});
	});

	describe('stopVideo', function () {

		it('should send StopVideo message to server and resolve when server responds successfully', async function () {
			const bridge = createMockBridgeClient((message: StopVideo) => {
				should(message).deepEqual(
					{ type: StopVideo, uri: 'video1', x: 0, y: 0, width: 1920, height: 1080 },
				);
			});
			const bridgeVideoClient = new BridgeVideoClient(bridge as any, new EventEmitter() as any);
			await bridgeVideoClient.stopVideo('video1', 0, 0, 1920, 1080);
		});

		it('should send StopVideo message to server and reject when server rejects', async function () {
			const bridge = createMockBridgeClient((message: StopVideo) => {
				if (message.type === StopVideo) {
					throw new Error('stop failed');
				}
			});
			const bridgeVideoClient = new BridgeVideoClient(bridge as any, new EventEmitter() as any);
			await should(bridgeVideoClient.stopVideo('video1', 0, 0, 1920, 1080)).be.rejected();
		});
	});

	describe('clearAll', function () {

		it('should send StopAllVideos message', async function () {
			const bridge = createMockBridgeClient((message: StopAllVideos) => {
				should(message).deepEqual({ type: StopAllVideos });
			});
			const bridgeVideoClient = new BridgeVideoClient(bridge as any, new EventEmitter() as any);
			await bridgeVideoClient.clearAll();
		});
	});
});
