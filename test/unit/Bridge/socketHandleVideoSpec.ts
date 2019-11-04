import * as sinon from 'sinon';
import {
	PlayVideo,
	PrepareVideo, StopAllVideos,
	StopVideo, VideoEnded,
	VideoError,
	VideoStopped,
} from '../../../src/Bridge/bridgeVideoMessages';
import socketHandleVideo from '../../../src/Bridge/socketHandleVideo';
import { EventEmitter } from 'events';
import IBridgeMessage from '../../../src/Bridge/IBridgeMessage';
import Orientation from '@signageos/front-display/es6/NativeDevice/Orientation';

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

		it('should prepare video and send a success response', function (done: () => void) {
			const videoPlayer = {
				prepare: sinon.stub().resolves(),
				addEventListener: sinon.spy(),
			};
			const sendMessage = sinon.stub().resolves();
			const socket = {
				...createMockSocket(),
				sendMessage,
				async bindMessage(_event: string, callback: (message: IBridgeMessage<any>) => Promise<void>) {
					await callback({
						invocationUid: 'message1',
						message: {
							type: PrepareVideo,
							uri: 'video1',
							x: 1,
							y: 2,
							width: 1280,
							height: 720,
							orientation: Orientation.LANDSCAPE,
							isStream: false,
						},
					});
					videoPlayer.prepare.callCount.should.equal(1);
					videoPlayer.prepare.getCall(0).args.should.deepEqual([
						'video1', 1, 2, 1280, 720, Orientation.LANDSCAPE, false,
					]);
					sendMessage.callCount.should.equal(1);
					sendMessage.getCall(0).args.should.deepEqual(['message1', { success: true, response: {} }]);
					done();
				},
			};
			socketHandleVideo(socket as any, videoPlayer as any);
		});

		it('should send a error response when video prepare fails', function (done: () => void) {
			const videoPlayer = {
				prepare: sinon.stub().rejects(),
				addEventListener: sinon.spy(),
			};
			const sendMessage = sinon.stub().resolves();
			const socket = {
				...createMockSocket(),
				sendMessage,
				async bindMessage(_event: string, callback: (message: IBridgeMessage<any>) => Promise<void>) {
					await callback({
						invocationUid: 'message2',
						message: {
							type: PrepareVideo,
							uri: 'video2',
							x: 0,
							y: 5,
							width: 1920,
							height: 1080,
							orientation: Orientation.LANDSCAPE,
							isStream: false,
						},
					});
					videoPlayer.prepare.callCount.should.equal(1);
					videoPlayer.prepare.getCall(0).args.should.deepEqual([
						'video2', 0, 5, 1920, 1080, Orientation.LANDSCAPE, false,
					]);
					sendMessage.callCount.should.equal(1);
					sendMessage.getCall(0).args.should.deepEqual(['message2', { success: false }]);
					done();
				},
			};
			socketHandleVideo(socket as any, videoPlayer as any);
		});
	});

	describe('on PlayVideo', function () {

		it('should play video and send a success response', function (done: () => void) {
			const videoPlayer = {
				play: sinon.stub().resolves(),
				addEventListener: sinon.spy(),
			};
			const sendMessage = sinon.stub().resolves();
			const socket = {
				...createMockSocket(),
				sendMessage,
				async bindMessage(_event: string, callback: (message: IBridgeMessage<any>) => Promise<void>) {
					await callback({
						invocationUid: 'message3',
						message: {
							type: PlayVideo,
							uri: 'video3',
							x: 10,
							y: 15,
							width: 1280,
							height: 720,
							orientation: Orientation.LANDSCAPE,
							isStream: false,
						},
					});
					videoPlayer.play.callCount.should.equal(1);
					videoPlayer.play.getCall(0).args.should.deepEqual([
						'video3', 10, 15, 1280, 720, Orientation.LANDSCAPE, false,
					]);
					sendMessage.callCount.should.equal(1);
					sendMessage.getCall(0).args.should.deepEqual(['message3', { success: true, response: {} }]);
					done();
				},
			};
			socketHandleVideo(socket as any, videoPlayer as any);
		});

		it('should send a error response when video play fails', function (done: () => void) {
			const videoPlayer = {
				play: sinon.stub().rejects(),
				addEventListener: sinon.spy(),
			};
			const sendMessage = sinon.stub().resolves();
			const socket = {
				...createMockSocket(),
				sendMessage,
				async bindMessage(_event: string, callback: (message: IBridgeMessage<any>) => Promise<void>) {
					await callback({
						invocationUid: 'message4',
						message: {
							type: PlayVideo,
							uri: 'video4',
							x: 20,
							y: 20,
							width: 1920,
							height: 1080,
							orientation: Orientation.LANDSCAPE,
							isStream: false,
						},
					});
					videoPlayer.play.callCount.should.equal(1);
					videoPlayer.play.getCall(0).args.should.deepEqual([
						'video4', 20, 20, 1920, 1080, Orientation.LANDSCAPE, false,
					]);
					sendMessage.callCount.should.equal(1);
					sendMessage.getCall(0).args.should.deepEqual(['message4', { success: false }]);
					done();
				},
			};
			socketHandleVideo(socket as any, videoPlayer as any);
		});
	});

	describe('on StopVideo', function () {

		it('should stop video and send a success response', function (done: () => void) {
			const videoPlayer = {
				stop: sinon.stub().resolves(),
				addEventListener: sinon.spy(),
			};
			const sendMessage = sinon.stub().resolves();
			const socket = {
				...createMockSocket(),
				sendMessage,
				async bindMessage(_event: string, callback: (message: IBridgeMessage<any>) => Promise<void>) {
					await callback({
						invocationUid: 'message5',
						message: { type: StopVideo, uri: 'video5', x: 10, y: 15, width: 1280, height: 720 },
					});
					videoPlayer.stop.callCount.should.equal(1);
					videoPlayer.stop.getCall(0).args.should.deepEqual([
						'video5', 10, 15, 1280, 720,
					]);
					sendMessage.callCount.should.equal(1);
					sendMessage.getCall(0).args.should.deepEqual(['message5', { success: true, response: {} }]);
					done();
				},
			};
			socketHandleVideo(socket as any, videoPlayer as any);
		});

		it('should send a error response when video stop fails', function (done: () => void) {
			const videoPlayer = {
				stop: sinon.stub().rejects(),
				addEventListener: sinon.spy(),
			};
			const sendMessage = sinon.stub().resolves();
			const socket = {
				...createMockSocket(),
				sendMessage,
				async bindMessage(_event: string, callback: (message: IBridgeMessage<any>) => Promise<void>) {
					await callback({
						invocationUid: 'message6',
						message: { type: StopVideo, uri: 'video6', x: 20, y: 20, width: 1920, height: 1080 },
					});
					videoPlayer.stop.callCount.should.equal(1);
					videoPlayer.stop.getCall(0).args.should.deepEqual([
						'video6', 20, 20, 1920, 1080,
					]);
					sendMessage.callCount.should.equal(1);
					sendMessage.getCall(0).args.should.deepEqual(['message6', { success: false }]);
					done();
				},
			};
			socketHandleVideo(socket as any, videoPlayer as any);
		});
	});

	describe('on StopAllVideos', function () {

		it('should stop all videos and send a success response', function (done: () => void) {
			const videoPlayer = {
				clearAll: sinon.stub().resolves(),
				addEventListener: sinon.spy(),
			};
			const sendMessage = sinon.stub().resolves();
			const socket = {
				...createMockSocket(),
				sendMessage,
				async bindMessage(_event: string, callback: (message: IBridgeMessage<any>) => Promise<void>) {
					await callback({ invocationUid: 'message7', message: { type: StopAllVideos } });
					videoPlayer.clearAll.callCount.should.equal(1);
					sendMessage.callCount.should.equal(1);
					sendMessage.getCall(0).args.should.deepEqual(['message7', { success: true, response: {} }]);
					done();
				},
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
