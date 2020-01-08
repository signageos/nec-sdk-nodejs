import { ISocket } from '@signageos/lib/dist/WebSocket/socketServer';
import ICECListener from '../CEC/ICECListener';
import Key from '../CEC/Key';

export default function socketHandleCEC(socket: ISocket, cecListener: ICECListener) {
	const eventListener = async (key: Key) => {
		await socket.sendMessage('keypress', key);
	};

	cecListener.onKeypress(eventListener);
	socket.getDisconnectedPromise().then(() => {
		cecListener.removeListener(eventListener);
	});
}