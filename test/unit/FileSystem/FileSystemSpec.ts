import * as sinon from 'sinon';
import FileSystem from '../../../src/FileSystem/FileSystem';
import { IStorageUnit } from '@signageos/front-display/es6/NativeDevice/fileSystem';

describe('FileSystem', function () {

	describe('getAbsolutePath', function () {

		it('should return correct path for internal storage unit', function () {
			const fileSystem = new FileSystem('/base/directory', '/tmp', 'SIGUSR2');
			const internalStorageUnit = {
				type: 'internal',
				capacity: 0,
				freeSpace: 0,
				usableSpace: 0,
				removable: false,
			} as IStorageUnit;
			const absolutePath = fileSystem.getAbsolutePath({
				filePath: 'test/file1',
				storageUnit: internalStorageUnit,
			});
			absolutePath.should.equal('/base/directory/internal/test/file1');
		});

		it('should return correct path for external storage unit', function () {
			const fileSystem = new FileSystem('/base/directory', '/tmp', 'SIGUSR2');
			const externalStorageUnit = {
				type: 'sda1',
				capacity: 0,
				freeSpace: 0,
				usableSpace: 0,
				removable: true,
			} as IStorageUnit;
			const absolutePath = fileSystem.getAbsolutePath({
				filePath: 'test2/file2',
				storageUnit: externalStorageUnit,
			});
			absolutePath.should.equal('/base/directory/external/sda1/test2/file2');
		});

		it('should return correct path for tmp storage unit', function () {
			const fileSystem = new FileSystem('/base/directory', '/tmp', 'SIGUSR2');
			const tmpStorageUnit = fileSystem.getTmpStorageUnit();
			const absolutePath = fileSystem.getAbsolutePath({
				filePath: 'test3/file3',
				storageUnit: tmpStorageUnit,
			});
			absolutePath.should.equal('/tmp/signageos/test3/file3');
		});
	});

	describe('onStorageUnitsChanged', function () {

		it('should call listener every time storage units changed', function () {
			const fileSystem = new FileSystem('/base/directory', '/tmp', 'TESTSIGNAL' as any);
			const listener = sinon.spy();
			fileSystem.onStorageUnitsChanged(listener);
			process.emit('TESTSIGNAL' as any);
			listener.callCount.should.equal(1);
		});
	});

	describe('removeStorageUnitsChangedListener', function () {

		it('should remove listener', function () {
			const fileSystem = new FileSystem('/base/directory', '/tmp', 'TESTSIGNAL' as any);
			const listener = sinon.spy();
			fileSystem.onStorageUnitsChanged(listener);
			fileSystem.removeStorageUnitsChangedListener(listener);
			process.emit('TESTSIGNAL' as any);
			listener.callCount.should.equal(0);
		});
	});
});
