import { ISocket } from '@signageos/lib/dist/WebSocket/socketServer';
import IBridgeMessage from './IBridgeMessage';
import IFileSystem from '../FileSystem/IFileSystem';
import IFileDetailsProvider from '../FileSystem/IFileDetailsProvider';
import IBasicDriver from '@signageos/front-display/es6/NativeDevice/IBasicDriver';
import IManagementDriver from '@signageos/front-display/es6/NativeDevice/Management/IManagementDriver';
import IDisplay from '../Driver/Display/IDisplay';
import OverlayRenderer from '../Overlay/OverlayRenderer';
import handleMessage from './handleMessage';
import * as Debug from 'debug';
import { MessageType } from './BridgeClient';
import { ISystemAPI } from '../API/SystemAPI';
const debug = Debug('@signageos/display-linux:Bridge:socketHandleMessage');

export default function socketHandleMessage(
	socket: ISocket,
	fileSystem: IFileSystem,
	fileDetailsProvider: IFileDetailsProvider,
	nativeDriver: IBasicDriver & IManagementDriver,
	getDisplay: () => Promise<IDisplay>,
	overlayRenderer: OverlayRenderer,
	systemAPI: ISystemAPI,
) {
	socket.bindMessage('message.' + MessageType.GENERIC, async (message: IBridgeMessage<any>) => {
		try {
			const response = await handleMessage(
				fileSystem,
				fileDetailsProvider,
				nativeDriver,
				getDisplay,
				overlayRenderer,
				systemAPI,
				message.message,
			);
			debug('bridge message success', message);
			await socket.sendMessage(message.invocationUid, { success: true, response });
		} catch (error) {
			debug('bridge message error', message);
			await socket.sendMessage(message.invocationUid, { success: false });
		}
	});
}
