import FrontDriver from './FrontDriver';
import FrontManagementDriver from './FrontManagementDriver';
import BridgeClient from '../Bridge/BridgeClient';
import FrontSystemSettings from '../SystemSettings/FrontSystemSettings';
import ISocket from '@signageos/lib/dist/WebSocket/Client/ISocket';
import BridgeVideoClient from '../Bridge/BridgeVideoClient';
import BridgeVideoPlayer from './Video/BridgeVideoPlayer';
import BridgeStreamPlayer from './Video/BridgeStreamPlayer';
import Browser from './Browser';
import FrontFileSystem from './FrontFileSystem';
import { adaptVideoPlayer, adaptStreamPlayer } from '@signageos/front-display/es6/NativeDevice/Screen/adaptPlayers';

export function createFrontDrivers(
	window: Window,
	serverUri: string,
	fileSystemUrl: string,
	frontAppletPrefix: string,
	maxVideoCount: number,
	socketClient: ISocket,
	waitUntilServerConnected: () => Promise<void>,
): { frontDriver: FrontDriver, managementDriver: FrontManagementDriver } {
	const bridge = new BridgeClient(serverUri, socketClient);
	const systemSettings = new FrontSystemSettings(bridge);
	const bridgeVideoClient = new BridgeVideoClient(bridge, socketClient);
	const baseVideoPlayer = new BridgeVideoPlayer(fileSystemUrl, bridgeVideoClient, maxVideoCount);
	const baseStreamPlayer = new BridgeStreamPlayer(window, bridge, bridgeVideoClient);
	const videoPlayer = adaptVideoPlayer(window, baseVideoPlayer, () => systemSettings.getScreenOrientation());
	const streamPlayer = adaptStreamPlayer(window, baseStreamPlayer, () => systemSettings.getScreenOrientation());
	const fileSystem = new FrontFileSystem(fileSystemUrl, bridge, socketClient);
	const browser = new Browser(window, bridge);
	const frontDriver = new FrontDriver(
		window, frontAppletPrefix, bridge, systemSettings, socketClient, videoPlayer, streamPlayer, fileSystem, browser,
	);
	const managementDriver = new FrontManagementDriver(
		bridge,
		systemSettings,
		socketClient,
		fileSystemUrl,
		waitUntilServerConnected,
	);
	return { frontDriver, managementDriver };
}
