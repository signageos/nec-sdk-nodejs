import { ISocket } from '@signageos/lib/dist/WebSocket/socketServer';
import IFileSystem from '../FileSystem/IFileSystem';

export default function socketHandleStorageUnitsChanged(socket: ISocket, fileSystem: IFileSystem) {
	const eventListener = async () => {
		await socket.sendMessage('storage_units_changed', {});
	};

	fileSystem.onStorageUnitsChanged(eventListener);
	socket.getDisconnectedPromise().then(() => {
		fileSystem.removeStorageUnitsChangedListener(eventListener);
	});
}
