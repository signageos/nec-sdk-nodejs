import { IFilePath, IStorageUnit } from '@signageos/front-display/es6/NativeDevice/fileSystem';

const testStorageUnit = {
	type: 'test',
	capacity: 0,
	freeSpace: 0,
	usableSpace: 0,
	removable: false,
} as IStorageUnit;

export function getFilePath(filePath: string): IFilePath {
	return {
		storageUnit: testStorageUnit,
		filePath,
	};
}
