import ISocket from '@signageos/lib/dist/WebSocket/Client/ISocket';
import { SECOND_IN_MS } from '@signageos/lib/dist/DateTime/millisecondConstants';
import { NotifyApplicationAlive } from '../Bridge/bridgeSystemMessages';

export function notifyClientAlive(socketClient: ISocket) {
	const NOTIFY_ALIVE_INTERVAL = 10 * SECOND_IN_MS;
	setNotifyAliveToSocket(socketClient);
	setInterval(
		() => setNotifyAliveToSocket(socketClient),
		NOTIFY_ALIVE_INTERVAL,
	);
}

function setNotifyAliveToSocket(socketClient: ISocket) {
	socketClient.emit(NotifyApplicationAlive, {});
}
