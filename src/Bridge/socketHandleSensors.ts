import { ISocket } from '@signageos/lib/dist/WebSocket/socketServer';
import IManagementDriver from '@signageos/front-display/es6/NativeDevice/Management/IManagementDriver';
import { ProximitySensorChange } from './bridgeSensorsMessages';

export default function socketHandleSensors(socket: ISocket, nativeDriver: IManagementDriver) {
	listenToProximitySensorChanges(socket, nativeDriver);
}

function listenToProximitySensorChanges(socket: ISocket, nativeDriver: IManagementDriver) {
	const eventListener = async (detected: boolean) => {
		await socket.sendMessage(ProximitySensorChange, {
			type: ProximitySensorChange,
			detected,
		});
	};
	try {
		nativeDriver.sensors.proximity.addStateChangeListener(eventListener);
		socket.getDisconnectedPromise().then(() => {
			nativeDriver.sensors.proximity.removeStateChangeListener(eventListener);
		});
	} catch (e) {
		// not supported
	}
}
