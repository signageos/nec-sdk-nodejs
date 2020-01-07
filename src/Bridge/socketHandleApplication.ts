import { ISocket } from '@signageos/lib/dist/WebSocket/socketServer';
import { NotifyApplicationAlive } from './bridgeSystemMessages';
import ClientWatchdog from '../Application/ClientWatchdog';

export default function socketHandleApplication(socket: ISocket, clientWatchdog: ClientWatchdog) {
	clientWatchdog.notifyAlive();
	socket.bindMessage(NotifyApplicationAlive, () => {
		clientWatchdog.notifyAlive();
	});
}
