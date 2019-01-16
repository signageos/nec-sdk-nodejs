import { IFilePath } from '@signageos/front-display/es6/NativeDevice/fileSystem';
import { IFileDetails } from './IFileDetails';

interface IFileDetailsProvider {
	getFileDetails(filePath: IFilePath): Promise<IFileDetails>;
}

export default IFileDetailsProvider;
