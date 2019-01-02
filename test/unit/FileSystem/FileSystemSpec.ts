import FileSystem from '../../../src/FileSystem/FileSystem';
import { IStorageUnit } from '@signageos/front-display/es6/NativeDevice/fileSystem';

describe('FileSystem', function () {

	describe('getAbsolutePath', function () {

		it('should return correct path for internal storage unit', function () {
			const fileSystem = new FileSystem('/base/directory', '/tmp');
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
			absolutePath.should.equal('/base/directory/internal/data/test/file1');
		});

		it('should return correct path for external storage unit', function () {
			const fileSystem = new FileSystem('/base/directory', '/tmp');
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
			absolutePath.should.equal('/base/directory/external/sda1/data/test2/file2');
		});

		it('should return correct path for tmp storage unit', function () {
			const fileSystem = new FileSystem('/base/directory', '/tmp');
			const tmpStorageUnit = fileSystem.getTmpStorageUnit();
			const absolutePath = fileSystem.getAbsolutePath({
				filePath: 'test3/file3',
				storageUnit: tmpStorageUnit,
			});
			absolutePath.should.equal('/tmp/signageos/test3/file3');
		});
	});
});
