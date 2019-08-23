import { EventEmitter } from 'events';
import { ISensors } from '@signageos/front-display/es6/NativeDevice/Management/IManagementDriver';
import IProximitySensor from '@signageos/front-display/es6/NativeDevice/Sensors/IProximitySensor';
import ISocket from '@signageos/lib/dist/WebSocket/Client/ISocket';
import { ProximitySensorChange } from '../Bridge/bridgeSensorsMessages';

class FrontProximitySensor implements IProximitySensor {

	private eventEmitter: EventEmitter;

	constructor(private socketClient: ISocket) {
		this.eventEmitter = new EventEmitter();
		this.listenToSocketEvents();
	}

	public addStateChangeListener(callback: (detected: boolean) => void): void {
		this.eventEmitter.addListener('change', callback);
	}

	public removeStateChangeListener(callback: (detected: boolean) => void): void {
		this.eventEmitter.removeListener('change', callback);
	}

	private listenToSocketEvents() {
		this.socketClient.on(ProximitySensorChange, (event: ProximitySensorChange) => {
			this.eventEmitter.emit('change', event.detected);
		});
	}
}

export function createFrontSensors(socketClient: ISocket): ISensors {
	return {
		proximity: new FrontProximitySensor(socketClient),
	};
}
