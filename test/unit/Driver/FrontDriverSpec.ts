import 'should';
import { EventEmitter } from 'events';
import * as sinon from 'sinon';
import KeyCode from '@signageos/front-display/es6/NativeDevice/Input/KeyCode';
import FrontDriver from '../../../src/Driver/FrontDriver';
import {
	GetModel,
	SystemReboot,
	FileSystemGetFiles,
	FileSystemFileExists,
	FileSystemDownloadFile,
	FileSystemDeleteFile,
} from '../../../src/Bridge/bridgeSystemMessages';

describe('Driver.FrontDriver', function () {

	describe('getModel', function () {

		it('should return model', async function () {
			const bridge = {
				invoke: sinon.stub()
					.withArgs({ type: GetModel })
					.resolves({ model: 'model1' }),
				socketClient: new EventEmitter(),
			};

			const frontDriver = new FrontDriver({} as any, '1.0.0', bridge as any, 'http://localhost:8081');
			const model = await frontDriver.getModel();
			model.should.equal('model1');
		});
	});

	describe('appReboot', function () {

		it('should invoke device reboot', async function () {
			const bridge = {
				invoke: sinon.spy(),
				socketClient: new EventEmitter(),
			};

			const frontDriver = new FrontDriver({} as any, '1.0.0', bridge as any, 'http://localhost:8081');
			await frontDriver.appReboot();
			bridge.invoke.callCount.should.equal(1);
			bridge.invoke.getCall(0).args[0].should.deepEqual({ type: SystemReboot });
		});
	});

	describe('appRestart', function () {

		it('should invoke restarting of the application', async function () {
			const window = {
				location: {
					reload: sinon.spy(),
				},
			};
			const bridge = {
				socketClient: new EventEmitter(),
			};

			const frontDriver = new FrontDriver(window as any, '1.0.0', bridge as any, 'http://localhost:8081');
			await frontDriver.appRestart();
			window.location.reload.callCount.should.equal(1);
		});
	});

	describe('getApplicationVersion', function () {

		it('should invoke restarting of the application', async function () {
			const bridge = { socketClient: new EventEmitter() };
			const frontDriver = new FrontDriver({} as any, '1.0.0', bridge as any, 'http://localhost:8081');
			const applicationVersion = await frontDriver.getApplicationVersion();
			applicationVersion.should.equal('1.0.0');
		});
	});

	describe('bindKeyUp', function () {

		it('should bind callback to key presses', function () {
			const eventEmitter = new EventEmitter();
			const window = {
				addEventListener: (type: string, listener: any) => eventEmitter.addListener(type, listener),
			};
			const bridge = {
				socketClient: new EventEmitter(),
			};

			const frontDriver = new FrontDriver(window as any, '1.0.0', bridge as any, 'http://localhost:8081');
			const callback = sinon.spy();
			frontDriver.bindKeyUp(callback);
			eventEmitter.emit('keyup', { keyCode: 0x25 });
			callback.callCount.should.equal(1);
			callback.getCall(0).args[0].should.deepEqual({ keyCode: KeyCode.ARROW_LEFT });
		});
	});

	describe('fileSystemGetFileUids', function () {

		it('should return uids of files', async function () {
			const bridge = {
				invoke: sinon.stub()
					.withArgs({ type: FileSystemGetFiles, path: 'front' })
					.resolves({
						files: ['file1', 'file2', 'file3', 'file4'],
					}),
				socketClient: new EventEmitter(),
			};

			const frontDriver = new FrontDriver({} as any, '1.0.0', bridge as any, 'http://localhost:8081');
			const fileUids = await frontDriver.fileSystemGetFileUids();
			fileUids.should.deepEqual(['file1', 'file2', 'file3', 'file4']);
		});
	});

	describe('fileSystemGetFiles', function () {

		it('should return files index', async function () {
			const bridge = {
				invoke: sinon.stub()
					.withArgs({ type: FileSystemGetFiles, path: 'front' })
					.resolves({
						files: ['file1', 'file2', 'file3', 'file4'],
					}),
				socketClient: new EventEmitter(),
			};

			const frontDriver = new FrontDriver({} as any, '1.0.0', bridge as any, 'http://localhost:8081');
			const files = await frontDriver.fileSystemGetFiles();
			files.should.deepEqual({
				file1: { filePath: 'http://localhost:8081/front/file1' },
				file2: { filePath: 'http://localhost:8081/front/file2' },
				file3: { filePath: 'http://localhost:8081/front/file3' },
				file4: { filePath: 'http://localhost:8081/front/file4' },
			});
		});
	});

	describe('fileSystemGetFile', function () {

		it('should return file full path', async function () {
			const bridge = {
				invoke: sinon.stub()
					.withArgs({ type: FileSystemFileExists, path: 'front/file1' })
					.resolves({ fileExists: true }),
				socketClient: new EventEmitter(),
			};

			const frontDriver = new FrontDriver({} as any, '1.0.0', bridge as any, 'http://localhost:8081');
			const file = await frontDriver.fileSystemGetFile('file1');
			file.should.deepEqual({ filePath: 'http://localhost:8081/front/file1' });
		});

		it('should fail for non-existent file', async function () {
			const bridge = {
				invoke: sinon.stub()
					.withArgs({ type: FileSystemFileExists, path: 'front/file1' })
					.resolves({ fileExists: false }),
				socketClient: new EventEmitter(),
			};

			const frontDriver = new FrontDriver({} as any, '1.0.0', bridge as any, 'http://localhost:8081');
			await frontDriver.fileSystemGetFile('file1').should.be.rejected();
		});
	});

	describe('fileSystemDeleteFile', function () {

		it('should delete file', async function () {
			const bridge = {
				invoke: sinon.spy(),
				socketClient: new EventEmitter(),
			};

			const frontDriver = new FrontDriver({} as any, '1.0.0', bridge as any, 'http://localhost:8081');
			await frontDriver.fileSystemDeleteFile('file1');
			bridge.invoke.callCount.should.equal(1);
			bridge.invoke.getCall(0).args[0].should.deepEqual({
				type: FileSystemDeleteFile,
				path: 'front/file1',
			});
		});
	});

	describe('fileSystemSaveFile', function () {

		it('should delete file', async function () {
			const bridge = {
				invoke: sinon.spy(),
				socketClient: new EventEmitter(),
			};

			const frontDriver = new FrontDriver({} as any, '1.0.0', bridge as any, 'http://localhost:8081');
			await frontDriver.fileSystemSaveFile('file1', 'http://some_uri.test', { header1: 'value1', header2: 'value2' });
			bridge.invoke.callCount.should.equal(1);
			bridge.invoke.getCall(0).args[0].should.deepEqual({
				type: FileSystemDownloadFile,
				path: 'front/file1',
				uri: 'http://some_uri.test',
				headers: { header1: 'value1', header2: 'value2' },
			});
		});
	});
});
