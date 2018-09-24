import IBasicDriver from '@signageos/front-display/es6/NativeDevice/IBasicDriver';
import {
	SystemReboot,
	GetDeviceUid,
	GetModel,
	ScreenTurnOff,
	ScreenTurnOn,
	FileSystemGetFiles,
	FileSystemFileExists,
	FileSystemDownloadFile,
	FileSystemDeleteFile,
	FileSystemGetFileChecksum,
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
		ScreenTurnOff |
		ScreenTurnOn |
		FileSystemGetFiles |
		FileSystemFileExists |
		FileSystemDownloadFile |
		FileSystemDeleteFile |
		FileSystemGetFileChecksum,
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

		case ScreenTurnOff:
			await SystemAPI.turnScreenOff();
			return {};

		case ScreenTurnOn:
			await SystemAPI.turnScreenOn();
			return {};

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

		case FileSystemGetFileChecksum:
			const checksum = await fileSystem.getFileChecksum(message.path, message.hashAlgorithm);
			return { checksum };
		default:
			throw new InvalidMessageError('invalid message type: ' + (message as any).type);
	}
}
