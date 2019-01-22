import IBasicDriver from '@signageos/front-display/es6/NativeDevice/IBasicDriver';
import IManagementDriver from '@signageos/front-display/es6/NativeDevice/Management/IManagementDriver';
import {
	ApplicationRestart,
	SystemReboot,
	GetDeviceUid,
	GetModel,
	GetSerialNumber,
	SetNativeDebug,
	ScreenTurnOff,
	ScreenTurnOn,
	NetworkGetInfo,
} from './bridgeSystemMessages';
import * as NetworkMessages from './bridgeNetworkMessages';
import * as FSMessages from './bridgeFileSystemMessages';
import * as OverlayMessages from './bridgeOverlayMessages';
import * as SystemAPI from '../API/SystemAPI';
import * as NetworkAPI from '../API/NetworkAPI';
import IFileSystem from '../FileSystem/IFileSystem';
import IFileDetailsProvider from '../FileSystem/IFileDetailsProvider';
import OverlayRenderer from '../Overlay/OverlayRenderer';

export class InvalidMessageError extends Error {}

export class ResourceNotFound extends Error {}

export default async function handleMessage(
	fileSystem: IFileSystem,
	fileDetailsProvider: IFileDetailsProvider,
	nativeDriver: IBasicDriver & IManagementDriver,
	overlayRenderer: OverlayRenderer,
	message:
		ApplicationRestart |
		SystemReboot |
		GetDeviceUid |
		GetModel |
		GetSerialNumber |
		SetNativeDebug |
		ScreenTurnOff |
		ScreenTurnOn |
		NetworkGetInfo |
		NetworkMessages.IsWifiSupported |
		NetworkMessages.IsWifiEnabled |
		NetworkMessages.EnableWifi |
		NetworkMessages.DisableWifi |
		NetworkMessages.ConnectToWifi |
		NetworkMessages.DisconnectFromWifi |
		NetworkMessages.GetConnectedToWifi |
		NetworkMessages.GetWifiCountryCode |
		NetworkMessages.SetWifiCountryCode |
		NetworkMessages.ScanWifiDevices |
		FSMessages.ListFiles |
		FSMessages.FileExists |
		FSMessages.DownloadFile |
		FSMessages.DeleteFile |
		FSMessages.MoveFile |
		FSMessages.GetFileDetails |
		FSMessages.GetFileChecksum |
		FSMessages.ExtractFile |
		FSMessages.CreateDirectory |
		FSMessages.IsDirectory |
		FSMessages.ListStorageUnits |
		OverlayMessages.Hide |
		OverlayMessages.HideAll,
): Promise<object> {
	switch (message.type) {
		case ApplicationRestart:
			await SystemAPI.restartApplication();
			return {};

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

		case NetworkMessages.IsWifiSupported:
			const isWifiSupported = await NetworkAPI.isWifiSupported();
			return { isWifiSupported };

		case NetworkMessages.IsWifiEnabled:
			const isWifiEnabled = await NetworkAPI.isWifiEnabled();
			return { isWifiEnabled };

		case NetworkMessages.EnableWifi:
			await NetworkAPI.enableWifi();
			return {};

		case NetworkMessages.DisableWifi:
			await NetworkAPI.disableWifi();
			return {};

		case NetworkMessages.ConnectToWifi:
			await NetworkAPI.connectToWifi(message.ssid, message.password);
			return {};

		case NetworkMessages.DisconnectFromWifi:
			await NetworkAPI.disconnectFromWifi();
			return {};

		case NetworkMessages.GetConnectedToWifi:
			const ssid = await NetworkAPI.getConnectedToWifi();
			return { ssid };

		case NetworkMessages.GetWifiCountryCode:
			const countryCode = await NetworkAPI.getWifiCountryCode();
			return { countryCode };

		case NetworkMessages.SetWifiCountryCode:
			await NetworkAPI.setWifiCountryCode(message.countryCode);
			return {};

		case NetworkMessages.ScanWifiDevices:
			const devices = await NetworkAPI.scanWifiDevices();
			return { devices };

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

		case FSMessages.GetFileDetails:
			const fileDetails = await fileDetailsProvider.getFileDetails(message.filePath);
			return { fileDetails };

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
			await overlayRenderer.hide(message.id);
			return {};

		case OverlayMessages.HideAll:
			await overlayRenderer.hideAll();
			return {};

		default:
			throw new InvalidMessageError('invalid message type: ' + (message as any).type);
	}
}
