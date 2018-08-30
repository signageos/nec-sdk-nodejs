import 'should';
import * as sinon from 'sinon';
import { EventEmitter } from 'events';
import KeyCode from '@signageos/front-display/es6/NativeDevice/Input/KeyCode';
import FrontDriver from '../../../src/Driver/FrontDriver';
import {
	GetModel,
	SystemReboot,
	FileSystemGetFiles,
	FileSystemGetFile,
	FileSystemDownloadFile,
	FileSystemDeleteFile,
} from '../../../src/Bridge/bridgeMessages';

describe('Driver.FrontDriver', function () {

	describe('getModel', function () {

		it('should return model', async function () {
			const bridge = {
				invoke: sinon.stub()
					.withArgs({ type: GetModel })
					.resolves({ model: 'model1' }),
			};

			const frontDriver = new FrontDriver({} as any, '1.0.0', bridge as any);
			const model = await frontDriver.getModel();
			model.should.equal('model1');
		});
	});

	describe('appReboot', function () {

		it('should invoke device reboot', async function () {
			const bridge = {
				invoke: sinon.spy(),
			};

			const frontDriver = new FrontDriver({} as any, '1.0.0', bridge as any);
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

			const frontDriver = new FrontDriver(window as any, '1.0.0', {} as any);
			await frontDriver.appRestart();
			window.location.reload.callCount.should.equal(1);
		});
	});

	describe('getApplicationVersion', function () {

		it('should invoke restarting of the application', async function () {
			const frontDriver = new FrontDriver({} as any, '1.0.0', {} as any);
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

			const frontDriver = new FrontDriver(window as any, '1.0.0', {} as any);
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
						files: {
							file1: '/absolute/path/to/file1',
							file2: '/absolute/path/to/file2',
							file3: '/absolute/path/to/file3',
							file4: '/absolute/path/to/file4',
						},
					}),
			};

			const frontDriver = new FrontDriver({} as any, '1.0.0', bridge as any);
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
						files: {
							file1: '/absolute/path/to/file1',
							file2: '/absolute/path/to/file2',
							file3: '/absolute/path/to/file3',
							file4: '/absolute/path/to/file4',
						},
					}),
			};

			const frontDriver = new FrontDriver({} as any, '1.0.0', bridge as any);
			const files = await frontDriver.fileSystemGetFiles();
			files.should.deepEqual({
				file1: { filePath: 'file:///absolute/path/to/file1' },
				file2: { filePath: 'file:///absolute/path/to/file2' },
				file3: { filePath: 'file:///absolute/path/to/file3' },
				file4: { filePath: 'file:///absolute/path/to/file4' },
			});
		});
	});

	describe('fileSystemGetFile', function () {

		it('should return file full path', async function () {
			const bridge = {
				invoke: sinon.stub()
					.withArgs({ type: FileSystemGetFile, path: 'front/file1' })
					.resolves({ file: '/absolute/path/to/front/file1' }),
			};

			const frontDriver = new FrontDriver({} as any, '1.0.0', bridge as any);
			const file = await frontDriver.fileSystemGetFile('file1');
			file.should.deepEqual({ filePath: 'file:///absolute/path/to/front/file1' });
		});
	});

	describe('fileSystemDeleteFile', function () {

		it('should delete file', async function () {
			const bridge = {
				invoke: sinon.spy(),
			};

			const frontDriver = new FrontDriver({} as any, '1.0.0', bridge as any);
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
			};

			const frontDriver = new FrontDriver({} as any, '1.0.0', bridge as any);
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
