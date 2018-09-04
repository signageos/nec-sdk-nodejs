import IBasicDriver from '@signageos/front-display/es6/NativeDevice/IBasicDriver';
import {
	SystemReboot,
	GetDeviceUid,
	GetModel,
	FileSystemGetFiles,
	FileSystemFileExists,
	FileSystemDownloadFile,
	FileSystemDeleteFile,
} from './bridgeSystemMessages';
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
		FileSystemFileExists |
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
			const files = await fileSystem.getFilesInDirectory(message.path);
			return { files };

		case FileSystemFileExists:
			const pathExists = await fileSystem.pathExists(message.path);
			const isFile = pathExists && await fileSystem.isFile(message.path);
			return { fileExists: isFile };

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
