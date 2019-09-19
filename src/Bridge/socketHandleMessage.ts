import { ISocket } from '@signageos/lib/dist/WebSocket/socketServer';
import IBridgeMessage from './IBridgeMessage';
import IFileSystem from '../FileSystem/IFileSystem';
import IFileDetailsProvider from '../FileSystem/IFileDetailsProvider';
import IBasicDriver from '@signageos/front-display/es6/NativeDevice/IBasicDriver';
import IManagementDriver from '@signageos/front-display/es6/NativeDevice/Management/IManagementDriver';
import IDisplay from '../Driver/Display/IDisplay';
import OverlayRenderer from '../Overlay/OverlayRenderer';
import handleMessage from './handleMessage';

export default function socketHandleMessage(
	socket: ISocket,
	fileSystem: IFileSystem,
	fileDetailsProvider: IFileDetailsProvider,
	nativeDriver: IBasicDriver & IManagementDriver,
	display: IDisplay,
	overlayRenderer: OverlayRenderer,
) {
	socket.bindMessage('message', async (message: IBridgeMessage<any>) => {
		try {
			const response = await handleMessage(fileSystem, fileDetailsProvider, nativeDriver, display, overlayRenderer, message.message);
			await socket.sendMessage(message.invocationUid, { success: true, response });
		} catch (error) {
			await socket.sendMessage(message.invocationUid, { success: false });
		}
	});
}
