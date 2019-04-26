import * as sinon from 'sinon';
import Orientation from '@signageos/front-display/es6/NativeDevice/Orientation';
import {
	AllVideosStopped,
	PlayVideo,
	PrepareVideo, StopAllVideos,
	StopVideo, VideoEnded,
	VideoError,
	VideoPrepared,
	VideoStarted,
	VideoStopped,
} from '../../../src/Bridge/bridgeVideoMessages';
import socketHandleVideo from '../../../src/Bridge/socketHandleVideo';
import { EventEmitter } from 'events';

function createMockSocket() {
	return {
		bindMessage: sinon.spy(),
		sendMessage: sinon.stub().resolves(),
		getDisconnectedPromise() {
			return new Promise(() => {/* do nothing */});
		},
	};
}

describe('Bridge.socketHandleVideo', function () {

	describe('on PrepareVideo', function () {

		it('should prepare video and send a VideoPrepared event', function (done: () => void) {
			const videoPlayer = {
				prepare: sinon.stub().resolves(),
				addEventListener: sinon.spy(),
			};
			const socket = {
				...createMockSocket(),
				async bindMessage(event: string, callback: (message: PrepareVideo) => Promise<void>) {
					if (event === PrepareVideo) {
						await callback({
							type: PrepareVideo,
							uri: 'test_uri',
							x: 0,
							y: 1,
							width: 1920,
							height: 1080,
							orientation: Orientation.LANDSCAPE,
							isStream: false,
						});
						videoPlayer.prepare.callCount.should.equal(1);
						videoPlayer.prepare.getCall(0).args.should.deepEqual([
							'test_uri', 0, 1, 1920, 1080, Orientation.LANDSCAPE, false,
						]);
						done();
					}
				},
				sendMessage: sinon.stub().callsFake(async (eventName: string, event: any) => {
					eventName.should.equal(VideoPrepared);
					event.should.deepEqual({
						uri: 'test_uri',
						x: 0,
						y: 1,
						width: 1920,
						height: 1080,
					});
				}),
			};
			socketHandleVideo(socket as any, videoPlayer as any);
		});

		it('should send VideoError event when video prepare fails', function (done: () => void) {
			const videoPlayer = {
				prepare: sinon.stub().rejects(),
				addEventListener: sinon.spy(),
			};
			const socket = {
				...createMockSocket(),
				async bindMessage(event: string, callback: (message: PrepareVideo) => Promise<void>) {
					if (event === PrepareVideo) {
						await callback({
							type: PrepareVideo,
							uri: 'test_uri',
							x: 0,
							y: 1,
							width: 1920,
							height: 1080,
							orientation: Orientation.LANDSCAPE,
							isStream: false,
						});
						videoPlayer.prepare.callCount.should.equal(1);
						videoPlayer.prepare.getCall(0).args.should.deepEqual([
							'test_uri', 0, 1, 1920, 1080, Orientation.LANDSCAPE, false,
						]);
						done();
					}
				},
				sendMessage: sinon.stub().callsFake(async (eventName: string, event: any) => {
					eventName.should.equal(VideoError);
					event.should.deepEqual({
						uri: 'test_uri',
						x: 0,
						y: 1,
						width: 1920,
						height: 1080,
						data: { message: 'Failed to prepare video' },
					});
				}),
			};
			socketHandleVideo(socket as any, videoPlayer as any);
		});
	});

	describe('on PlayVideo', function () {

		it('should play video and send a VideoStarted event', function (done: () => void) {
			const videoPlayer = {
				play: sinon.stub().resolves(),
				addEventListener: sinon.spy(),
			};
			const socket = {
				...createMockSocket(),
				async bindMessage(event: string, callback: (message: PlayVideo) => Promise<void>) {
					if (event === PlayVideo) {
						await callback({
							type: PlayVideo,
							uri: 'test_uri',
							x: 0,
							y: 1,
							width: 1920,
							height: 1080,
							orientation: Orientation.LANDSCAPE,
							isStream: false,
						});
						videoPlayer.play.callCount.should.equal(1);
						videoPlayer.play.getCall(0).args.should.deepEqual([
							'test_uri', 0, 1, 1920, 1080, Orientation.LANDSCAPE, false,
						]);
						done();
					}
				},
				sendMessage: sinon.stub().callsFake(async (eventName: string, event: any) => {
					eventName.should.equal(VideoStarted);
					event.should.deepEqual({
						uri: 'test_uri',
						x: 0,
						y: 1,
						width: 1920,
						height: 1080,
					});
				}),
			};
			socketHandleVideo(socket as any, videoPlayer as any);
		});

		it('should send VideoError event when video play fails', function (done: () => void) {
			const videoPlayer = {
				play: sinon.stub().rejects(),
				addEventListener: sinon.spy(),
			};
			const socket = {
				...createMockSocket(),
				async bindMessage(event: string, callback: (message: PlayVideo) => Promise<void>) {
					if (event === PlayVideo) {
						await callback({
							type: PlayVideo,
							uri: 'test_uri',
							x: 0,
							y: 1,
							width: 1920,
							height: 1080,
							orientation: Orientation.LANDSCAPE,
							isStream: false,
						});
						videoPlayer.play.callCount.should.equal(1);
						videoPlayer.play.getCall(0).args.should.deepEqual([
							'test_uri', 0, 1, 1920, 1080, Orientation.LANDSCAPE, false,
						]);
						done();
					}
				},
				sendMessage: sinon.stub().callsFake(async (eventName: string, event: any) => {
					eventName.should.equal(VideoError);
					event.should.deepEqual({
						uri: 'test_uri',
						x: 0,
						y: 1,
						width: 1920,
						height: 1080,
						data: { message: 'Failed to start video playback' },
					});
				}),
			};
			socketHandleVideo(socket as any, videoPlayer as any);
		});
	});

	describe('on StopVideo', function () {

		it('should stop video and send a VideoStopped event', function (done: () => void) {
			const videoPlayer = {
				stop: sinon.stub().resolves(),
				addEventListener: sinon.spy(),
			};
			const socket = {
				...createMockSocket(),
				async bindMessage(event: string, callback: (message: StopVideo) => Promise<void>) {
					if (event === StopVideo) {
						await callback({
							type: StopVideo,
							uri: 'test_uri',
							x: 0,
							y: 1,
							width: 1920,
							height: 1080,
						});
						videoPlayer.stop.callCount.should.equal(1);
						videoPlayer.stop.getCall(0).args.should.deepEqual([
							'test_uri', 0, 1, 1920, 1080,
						]);
						done();
					}
				},
				sendMessage: sinon.stub().callsFake(async (eventName: string, event: any) => {
					eventName.should.equal(VideoStopped);
					event.should.deepEqual({
						uri: 'test_uri',
						x: 0,
						y: 1,
						width: 1920,
						height: 1080,
					});
				}),
			};
			socketHandleVideo(socket as any, videoPlayer as any);
		});

		it('should send VideoError event when video play fails', function (done: () => void) {
			const videoPlayer = {
				stop: sinon.stub().rejects(),
				addEventListener: sinon.spy(),
			};
			const socket = {
				...createMockSocket(),
				async bindMessage(event: string, callback: (message: StopVideo) => Promise<void>) {
					if (event === StopVideo) {
						await callback({
							type: StopVideo,
							uri: 'test_uri',
							x: 0,
							y: 1,
							width: 1920,
							height: 1080,
						});
						videoPlayer.stop.callCount.should.equal(1);
						videoPlayer.stop.getCall(0).args.should.deepEqual([
							'test_uri', 0, 1, 1920, 1080,
						]);
						done();
					}
				},
				sendMessage: sinon.stub().callsFake(async (eventName: string, event: any) => {
					eventName.should.equal(VideoError);
					event.should.deepEqual({
						uri: 'test_uri',
						x: 0,
						y: 1,
						width: 1920,
						height: 1080,
						data: { message: 'Failed to stop video playback' },
					});
				}),
			};
			socketHandleVideo(socket as any, videoPlayer as any);
		});
	});

	describe('on StopAllVideos', function () {

		it('should stop all videos and send a AllVideosStopped event', function (done: () => void) {
			const videoPlayer = {
				clearAll: sinon.stub().resolves(),
				addEventListener: sinon.spy(),
			};
			const socket = {
				...createMockSocket(),
				async bindMessage(event: string, callback: (message: StopAllVideos) => Promise<void>) {
					if (event === StopAllVideos) {
						await callback({
							type: StopAllVideos,
						});
						videoPlayer.clearAll.callCount.should.equal(1);
						done();
					}
				},
				sendMessage: sinon.stub().callsFake(async (eventName: string) => {
					eventName.should.equal(AllVideosStopped);
				}),
			};
			socketHandleVideo(socket as any, videoPlayer as any);
		});
	});

	describe('when video emits an event', function () {

		it('should emit "ended" send to socket when video ends', function () {
			const eventEmitter = new EventEmitter();
			const videoPlayer = {
				addEventListener: (eventName: string, listener: any) => {
					eventEmitter.addListener(eventName, listener);
				},
			};
			const socket = createMockSocket();
			socketHandleVideo(socket as any, videoPlayer as any);
			const event = {
				srcArguments: {
					uri: 'test_uri',
					x: 0,
					y: 1,
					width: 1920,
					height: 1080,
				},
			};
			eventEmitter.emit('ended', event);
			socket.sendMessage.callCount.should.equal(1);
			socket.sendMessage.getCall(0).args.should.deepEqual([VideoEnded, event.srcArguments]);
		});

		it('should emit "stopped" send to socket when video is manually stopped', function () {
			const eventEmitter = new EventEmitter();
			const videoPlayer = {
				addEventListener: (eventName: string, listener: any) => {
					eventEmitter.addListener(eventName, listener);
				},
			};
			const socket = createMockSocket();
			socketHandleVideo(socket as any, videoPlayer as any);
			const event = {
				srcArguments: {
					uri: 'test_uri',
					x: 0,
					y: 1,
					width: 1920,
					height: 1080,
				},
			};
			eventEmitter.emit('stopped', event);
			socket.sendMessage.callCount.should.equal(1);
			socket.sendMessage.getCall(0).args.should.deepEqual([VideoStopped, event.srcArguments]);
		});

		it('should emit "error" send to socket when video emits an error', function () {
			const eventEmitter = new EventEmitter();
			const videoPlayer = {
				addEventListener: (eventName: string, listener: any) => {
					eventEmitter.addListener(eventName, listener);
				},
			};
			const socket = createMockSocket();
			socketHandleVideo(socket as any, videoPlayer as any);
			const event = {
				srcArguments: {
					uri: 'test_uri',
					x: 0,
					y: 1,
					width: 1920,
					height: 1080,
				},
				data: { message: 'error' },
			};
			eventEmitter.emit('error', event);
			socket.sendMessage.callCount.should.equal(1);
			socket.sendMessage.getCall(0).args.should.deepEqual([
				VideoError,
				{
					...event.srcArguments,
					data: { message: 'error' },
				},
			]);
		});
	});
});
