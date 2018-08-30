import * as path from 'path';
import IBasicDriver from '@signageos/front-display/es6/NativeDevice/IBasicDriver';
import {
	SystemReboot,
	GetDeviceUid,
	GetModel,
	FileSystemGetFiles,
	FileSystemGetFile,
	FileSystemDownloadFile,
	FileSystemDeleteFile,
} from './bridgeMessages';
import * as SystemAPI from '../API/SystemAPI';
import IFileSystem from '../FileSystem/IFileSystem';

export class InvalidMessageError extends Error {}

export default async function handleMessage(
	fileSystem: IFileSystem,
	nativeDriver: IBasicDriver,
	message:
		SystemReboot |
		GetDeviceUid |
		GetModel |
		FileSystemGetFiles |
		FileSystemGetFile |
		FileSystemDownloadFile |
		FileSystemDeleteFile,
): Promise<object> {
	switch (message.type) {
		case SystemReboot:
			await SystemAPI.reboot();
			return {};

		case GetDeviceUid:
			const deviceUid = await nativeDriver.getDeviceUid();
			return { deviceUid };

		case GetModel:
			const model = await SystemAPI.getModel();
			return { model };

		case FileSystemGetFiles:
			const filenames = await fileSystem.getFilesInDirectory(message.path);
			const fullDirectoryPath = fileSystem.getFullPath(message.path);
			const files: { [filename: string]: string } = {};
			for (let filename of filenames) {
				files[filename] = path.join(fullDirectoryPath, filename);
			}
			return { files };

		case FileSystemGetFile:
			const fileFullPath = fileSystem.getFullPath(message.path);
			return { file: fileFullPath };

		case FileSystemDownloadFile:
			await fileSystem.downloadFile(message.path, message.uri, message.headers);
			return {};

		case FileSystemDeleteFile:
			await fileSystem.deleteFile(message.path);
			return {};

		default:
			throw new InvalidMessageError('invalid message type: ' + (message as any).type);
	}
}
