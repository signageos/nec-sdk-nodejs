import { EventEmitter } from 'events';
import * as should from 'should';
import * as sinon from 'sinon';
import wait from '@signageos/lib/dist/Timer/wait';
import Orientation from '@signageos/front-display/es6/NativeDevice/Orientation';
import ServerVideo from '../../../../src/Driver/Video/ServerVideo';
import { ChildProcess } from "child_process";
import IUnixSocketEventListener from '../../../../src/UnixSocket/IUnixSocketEventListener';
import { IFilePath, IStorageUnit } from '@signageos/front-display/es6/NativeDevice/fileSystem';

interface IMockVideoAPI {
	prepareVideo?(
		filePath: string,
		x: number,
		y: number,
		width: number,
		height: number,
		orientation: Orientation,
	): ChildProcess;
	playVideo?(videoProcess: ChildProcess): Promise<void>;
	stopVideo?(videoProcess: ChildProcess): Promise<void>;
	prepareStream?(
		filePath: string,
		x: number,
		y: number,
		width: number,
		height: number,
		orientation: Orientation,
	): ChildProcess;

	playStream?(streamProcess: ChildProcess): Promise<void>;
	stopStream?(streamProcess: ChildProcess): Promise<void>;
}

class MockVideoEventListener extends EventEmitter implements IUnixSocketEventListener {

	public getSocketPath(): string {
		return "/tmp/test.sock";
	}

	public async listen(): Promise<void> {
		// do nothing
	}

}

const testStorageUnit = {
	type: 'test',
	capacity: 0,
	freeSpace: 0,
	usableSpace: 0,
	removable: false,
};

function createServerVideo(
	videoEventListener: IUnixSocketEventListener,
	mockVideoAPI: IMockVideoAPI = {},
	key: string = 'test_video',
) {
	function createMockChildProcess() {
		return new EventEmitter();
	}

	const videoAPI = {
		prepareVideo: sinon.stub().callsFake(createMockChildProcess),
		playVideo: sinon.stub().resolves(),
		stopVideo: sinon.stub().resolves(),
		prepareStream: sinon.stub().callsFake(createMockChildProcess),
		playStream: sinon.stub().resolves(),
		stopStream: sinon.stub().resolves(),
		...mockVideoAPI,
	};

	const mockFileSystem = {
		getAbsolutePath(filePath: IFilePath) {
			return filePath.storageUnit.type + '/' + filePath.filePath;
		},
		convertRelativePathToFilePath(relativePath: string) {
			return {
				filePath: relativePath.substring(testStorageUnit.type.length + 1),
				storageUnit: testStorageUnit,
			};
		},
		async listStorageUnits(): Promise<IStorageUnit[]> {
			return [ testStorageUnit ];
		},
	};

	return new ServerVideo(mockFileSystem as any, key, videoAPI as any, videoEventListener);
}

describe('Driver.Video.ServerVideo', function () {

	describe('construct', function () {

		it('should be idle and have no video arguments when constructed', function () {
			const serverVideo = createServerVideo(new MockVideoEventListener());
			serverVideo.isIdle().should.be.true();
			should(serverVideo.getVideoArguments()).be.null();
		});
	});

	describe('prepare', function () {

		it('should create video child process', async function () {
			const prepareVideo = sinon.stub().returns(new EventEmitter());
			const prepareStream = sinon.spy();
			const videoEventListener = new MockVideoEventListener();
			const serverVideo = createServerVideo(videoEventListener, { prepareVideo, prepareStream });

			const preparedPromise = serverVideo.prepare('test/video1Uri', 0, 1, 1920, 1080, Orientation.LANDSCAPE, false);
			videoEventListener.emit('ready');
			await preparedPromise;
			prepareVideo.calledOnce.should.be.true();
			prepareVideo.getCall(0).args.should.deepEqual(['test/video1Uri', 0, 1, 1920, 1080, Orientation.LANDSCAPE, '/tmp/test.sock']);
			prepareStream.called.should.be.false();
			serverVideo.isIdle().should.be.true();
			serverVideo.getVideoArguments()!.should.deepEqual({ uri: 'test/video1Uri', x: 0, y: 1, width: 1920, height: 1080 });
		});

		it('should create stream child process', async function () {
			const prepareVideo = sinon.spy();
			const prepareStream = sinon.stub().returns(new EventEmitter());
			const videoEventListener = new MockVideoEventListener();
			const serverVideo = createServerVideo(videoEventListener, { prepareVideo, prepareStream });

			const preparedPromise = serverVideo.prepare('stream1Uri', 0, 1, 1920, 1080, Orientation.LANDSCAPE, true);
			videoEventListener.emit('ready');
			await preparedPromise;
			prepareStream.calledOnce.should.be.true();
			prepareStream.getCall(0).args.should.deepEqual(['stream1Uri', 0, 1, 1920, 1080, Orientation.LANDSCAPE, '/tmp/test.sock']);
			prepareVideo.called.should.be.false();
			serverVideo.isIdle().should.be.true();
			serverVideo.getVideoArguments()!.should.deepEqual({ uri: 'stream1Uri', x: 0, y: 1, width: 1920, height: 1080 });
		});

		it('should stop playing child process and then prepare new child process', async function () {
			const videoEventEmitter = new EventEmitter();
			const videoChildProcess = {
				once: (event: string, listener: any) => videoEventEmitter.once(event, listener),
				on: (event: string, listener: any) => videoEventEmitter.on(event, listener),
				kill: sinon.spy(),
			};

			const prepareVideo = sinon.stub().returns(videoChildProcess);
			const videoEventListener = new MockVideoEventListener();
			const serverVideo = createServerVideo(videoEventListener, { prepareVideo });

			const preparedPromise = serverVideo.prepare('test/videoUri1', 0, 1, 1920, 1080, Orientation.LANDSCAPE, false);
			videoEventListener.emit('ready');
			await preparedPromise;

			const startedPromise = serverVideo.play();
			videoEventListener.emit('started');
			await startedPromise;
			serverVideo.isPlaying().should.be.true();

			const preparedPromise2 = serverVideo.prepare('test/videoUri2', 2, 3, 1000, 500, Orientation.LANDSCAPE, false);
			await wait(500);
			videoEventListener.emit('ready');
			await preparedPromise2;

			serverVideo.isIdle().should.be.true();
			serverVideo.getVideoArguments()!.should.deepEqual({ uri: 'test/videoUri2', x: 2, y: 3, width: 1000, height: 500 });
		});
	});

	describe('play', function () {

		it('should start the video playback and change internal state to PLAYING', async function () {
			class MockVideoProcess extends EventEmitter {
				constructor(public uri: string) {
					super();
				}
			}

			const playVideo = sinon.stub().resolves();
			const videoEventListener = new MockVideoEventListener();
			const serverVideo = createServerVideo(videoEventListener, {
				prepareVideo: (uri: string) => new MockVideoProcess(uri) as any,
				playVideo,
			});

			const preparedPromise = serverVideo.prepare('test/videoUri1', 0, 1, 1920, 1080, Orientation.LANDSCAPE, false);
			videoEventListener.emit('ready');
			await preparedPromise;

			const startedPromise = serverVideo.play();
			videoEventListener.emit('started');
			await startedPromise;

			serverVideo.isPlaying().should.be.true();
			playVideo.calledOnce.should.be.true();
			playVideo.getCall(0).args[0].uri.should.equal('test/videoUri1');
		});

		it('should throw error if the video isn\'t prepared', async function () {
			const serverVideo = createServerVideo(new MockVideoEventListener());
			await serverVideo.play().should.be.rejected();
		});
	});

	describe('stop', function () {

		it('should stop running process and change internal state to IDLE', async function () {
			const stopVideo = sinon.spy();
			const videoEventListener = new MockVideoEventListener();
			const serverVideo = createServerVideo(videoEventListener, { stopVideo });

			const preparedPromise = serverVideo.prepare('test/videoUri1', 0, 1, 1920, 1080, Orientation.LANDSCAPE, false);
			videoEventListener.emit('ready');
			await preparedPromise;

			const startedPromise = serverVideo.play();
			videoEventListener.emit('started');
			await startedPromise;

			serverVideo.isPlaying().should.be.true();
			await serverVideo.stop();
			serverVideo.isIdle().should.be.true();
			stopVideo.calledOnce.should.be.true();
		});

		it('should throw error when trying to stop video that\'s not playing', async function () {
			const serverVideo = createServerVideo(new MockVideoEventListener());
			await serverVideo.stop().should.be.rejected();
		});
	});
});
