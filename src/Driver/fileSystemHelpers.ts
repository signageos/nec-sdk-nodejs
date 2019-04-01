import { IFilePath } from '@signageos/front-display/es6/NativeDevice/fileSystem';
import { EXTERNAL_STORAGE_UNITS_PATH } from '../FileSystem/IFileSystem';

export function getFileUriPath(filePath: IFilePath) {
	let uriPath = `${filePath.storageUnit.type}/${filePath.filePath}`;
	if (filePath.storageUnit.removable) {
		uriPath = EXTERNAL_STORAGE_UNITS_PATH + '/' + uriPath;
	}
	return uriPath;
}
