import { IFilePath } from '@signageos/front-display/es6/NativeDevice/fileSystem';
import { IExtendedFileDetails } from './IFileDetails';

interface IFileMetadataCache {
	getFileMetadata(filePath: IFilePath, lastModifiedAt: number): Promise<IExtendedFileDetails>;
	saveFileMetadata(filePath: IFilePath, lastModifiedAt: number, metadata: IExtendedFileDetails): Promise<void>;
}

export default IFileMetadataCache;
