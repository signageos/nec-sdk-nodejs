import * as moment from 'moment';
import IBasicDriver from '@signageos/front-display/es6/NativeDevice/IBasicDriver';
import IManagementDriver from '@signageos/front-display/es6/NativeDevice/Management/IManagementDriver';
import {
	GetDeviceUid,
	GetModel,
	GetSerialNumber,
	NetworkGetInfo,
	Supports,
	GetCurrentTimeWithTimezone,
	SetManualTimeWithTimezone,
	SetNTPTimeWithTimezone,
} from './bridgeSystemMessages';
import * as NetworkMessages from './bridgeNetworkMessages';
import * as FSMessages from './bridgeFileSystemMessages';
import * as OverlayMessages from './bridgeOverlayMessages';
import * as ScreenMessages from './bridgeScreenMessages';
import * as PowerMessages from './bridgePowerMessages';
import * as AudioMessages from './bridgeAudioMessages';
import * as VideoMessages from './bridgeVideoMessages';
import * as SystemAPI from '../API/SystemAPI';
import * as NetworkAPI from '../API/NetworkAPI';
import IFileSystem from '../FileSystem/IFileSystem';
import IFileDetailsProvider from '../FileSystem/IFileDetailsProvider';
import OverlayRenderer from '../Overlay/OverlayRenderer';
import Resolution from '@signageos/front-display/es6/NativeDevice/Resolution';
import IDisplay from '../Driver/Display/IDisplay';

export class InvalidMessageError extends Error {}

export class ResourceNotFound extends Error {}

export default async function handleMessage(
	fileSystem: IFileSystem,
	fileDetailsProvider: IFileDetailsProvider,
	nativeDriver: IBasicDriver & IManagementDriver,
	display: IDisplay,
	overlayRenderer: OverlayRenderer,
	message:
		Supports |
		GetDeviceUid |
		GetModel |
		GetSerialNumber |
		NetworkGetInfo |
		GetCurrentTimeWithTimezone |
		SetManualTimeWithTimezone |
		SetNTPTimeWithTimezone |
		ScreenMessages.SetOrientation |
		PowerMessages.AppRestart |
		PowerMessages.SystemReboot |
		PowerMessages.GetTimers |
		PowerMessages.SetTimer |
		ScreenMessages.PowerOff |
		ScreenMessages.PowerOn |
		ScreenMessages.SetBrightness |
		ScreenMessages.GetBrightness |
		AudioMessages.SetVolume |
		AudioMessages.GetVolume |
		VideoMessages.OpenInternalVideoInput |
		VideoMessages.CloseInternalVideoInput |
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
		FSMessages.CopyFile |
		FSMessages.MoveFile |
		FSMessages.ReadFile |
		FSMessages.WriteFile |
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
		case GetDeviceUid:
			const deviceUid = await nativeDriver.getDeviceUid();
			return { deviceUid };

		case GetModel:
			const model = await SystemAPI.getModel();
			return { model };

		case Supports:
			const supports = await nativeDriver.managementSupports(message.capability);
			return { supports };

		case GetSerialNumber:
			const serialNumber = await nativeDriver.getSerialNumber();
			return { serialNumber };

		case GetCurrentTimeWithTimezone:
			const currentTime = await nativeDriver.getCurrentTimeWithTimezone();
			return {
				currentTimestampMs: currentTime.currentDate.valueOf(),
				timezone: currentTime.timezone,
				ntpServer: currentTime.ntpServer,
			};

		case SetManualTimeWithTimezone:
			const datetime = moment(message.timestampMs);
			await nativeDriver.setManualTimeWithTimezone(datetime, message.timezone);
			return {};

		case SetNTPTimeWithTimezone:
			await nativeDriver.setNTPTimeWithTimezone(message.ntpServer, message.timezone);
			return {};

		case ScreenMessages.SetOrientation:
			// TODO front display should not accept unused parameters when are not necessary
			await nativeDriver.screenResize('unused', message.orientation, Resolution.FULL_HD, 'unused');
			return {};

		case ScreenMessages.PowerOff:
			await nativeDriver.displayPowerOff();
			return {};

		case ScreenMessages.PowerOn:
			await nativeDriver.displayPowerOn();
			return {};

		case ScreenMessages.SetBrightness:
			await nativeDriver.screenSetBrightness(
				message.brightness.timeFrom1,
				message.brightness.brightness1,
				message.brightness.timeFrom2,
				message.brightness.brightness2,
			);
			return {};

		case ScreenMessages.GetBrightness:
			const brightness = await nativeDriver.screenGetBrightness();
			return { brightness };

		case NetworkGetInfo:
			const networkInfo = await nativeDriver.getNetworkInfo();
			return { networkInfo };

		case NetworkMessages.IsWifiSupported:
			const isWifiSupported = await NetworkAPI.isWifiSupported();
			return { isWifiSupported };

		case PowerMessages.AppRestart:
			await nativeDriver.appRestart();
			return {};

		case PowerMessages.SystemReboot:
			await nativeDriver.systemReboot();
			return {};

		case PowerMessages.GetTimers:
			const timers = await nativeDriver.getTimers();
			return { timers };

		case PowerMessages.SetTimer:
			await nativeDriver.setTimer(
				message.timerType,
				message.timeOn,
				message.timeOff,
				message.weekdays,
				message.volume,
			);
			return {};

		case AudioMessages.SetVolume:
			await nativeDriver.setVolume(message.volume);
			return {};

		case AudioMessages.GetVolume:
			const volume = await nativeDriver.getVolume();
			return { volume };

		case VideoMessages.OpenInternalVideoInput:
			await display.openVideoInput(message.input);
			return {};

		case VideoMessages.CloseInternalVideoInput:
			await display.closeVideoInput();
			return {};

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

		case FSMessages.CopyFile:
			await fileSystem.copyFile(message.sourceFilePath, message.destinationFilePath);
			return {};

		case FSMessages.MoveFile:
			await fileSystem.moveFile(message.sourceFilePath, message.destinationFilePath);
			return {};

		case FSMessages.ReadFile:
			const contents = await fileSystem.readFile(message.filePath);
			return { contents };

		case FSMessages.WriteFile:
			await fileSystem.writeFile(message.filePath, message.contents);
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
