import IBasicDriver from '@signageos/front-display/es6/NativeDevice/IBasicDriver';
import IManagementDriver from '@signageos/front-display/es6/NativeDevice/Management/IManagementDriver';
import {
	SystemReboot,
	GetDeviceUid,
	GetModel,
	GetSerialNumber,
	SetNativeDebug,
	ScreenTurnOff,
	ScreenTurnOn,
	NetworkGetInfo,
} from './bridgeSystemMessages';
import * as FSMessages from './bridgeFileSystemMessages';
import * as OverlayMessages from './bridgeOverlayMessages';
import * as SystemAPI from '../API/SystemAPI';
import IFileSystem from '../FileSystem/IFileSystem';
import OverlayRenderer from '../Overlay/OverlayRenderer';

export class InvalidMessageError extends Error {}
export class ResourceNotFound extends Error {}

export default async function handleMessage(
	fileSystem: IFileSystem,
	nativeDriver: IBasicDriver & IManagementDriver,
	overlayRenderer: OverlayRenderer,
	message:
		SystemReboot |
		GetDeviceUid |
		GetModel |
		GetSerialNumber |
		SetNativeDebug |
		ScreenTurnOff |
		ScreenTurnOn |
		NetworkGetInfo |
		FSMessages.ListFiles |
		FSMessages.FileExists |
		FSMessages.DownloadFile |
		FSMessages.DeleteFile |
		FSMessages.MoveFile |
		FSMessages.GetFileChecksum |
		FSMessages.ExtractFile |
		FSMessages.CreateDirectory |
		FSMessages.IsDirectory |
		FSMessages.ListStorageUnits |
		OverlayMessages.Hide |
		OverlayMessages.HideAll,
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

		case GetSerialNumber:
			const serialNumber = await nativeDriver.getSerialNumber();
			return { serialNumber };

		case SetNativeDebug:
			if (message.isEnabled) {
				await SystemAPI.enableNativeDebug();
			} else {
				await SystemAPI.disableNativeDebug();
			}
			return {};

		case ScreenTurnOff:
			await SystemAPI.turnScreenOff();
			return {};

		case ScreenTurnOn:
			await SystemAPI.turnScreenOn();
			return {};

		case NetworkGetInfo:
			const networkInfo = await nativeDriver.getNetworkInfo();
			return { networkInfo };

		case FSMessages.ListFiles:
			const files = await fileSystem.listFiles(message.directoryPath);
			return { files };

		case FSMessages.FileExists:
			const exists = await fileSystem.exists(message.filePath);
			return { exists };

		case FSMessages.DownloadFile:
			await fileSystem.downloadFile(message.filePath, message.sourceUri, message.headers);
			return {};

		case FSMessages.DeleteFile:
			await fileSystem.deleteFile(message.filePath, message.recursive);
			return {};

		case FSMessages.MoveFile:
			await fileSystem.moveFile(message.sourceFilePath, message.destinationFilePath);
			return {};

		case FSMessages.GetFileChecksum:
			const checksum = await fileSystem.getFileChecksum(message.filePath, message.hashType);
			return { checksum };

		case FSMessages.ExtractFile:
			await fileSystem.extractFile(message.archiveFilePath, message.destinationDirectoryPath, message.method);
			return {};

		case FSMessages.CreateDirectory:
			await fileSystem.createDirectory(message.directoryPath);
			return {};

		case FSMessages.IsDirectory:
			const isDirectory = await fileSystem.isDirectory(message.filePath);
			return { isDirectory };

		case FSMessages.ListStorageUnits:
			const storageUnits = await fileSystem.listStorageUnits();
			return { storageUnits };

		case OverlayMessages.Hide:
			await overlayRenderer.hide(message.id, message.appletUid);
			return {};

		case OverlayMessages.HideAll:
			await overlayRenderer.hideAll();
			return {};

		default:
			throw new InvalidMessageError('invalid message type: ' + (message as any).type);
	}
}
