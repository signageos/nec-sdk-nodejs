import { EventEmitter } from 'events';
import { locked } from '@signageos/front-display/es6/Lock/lockedDecorator';
import IProximitySensor from '@signageos/front-display/es6/NativeDevice/Sensors/IProximitySensor';
import { INECAPI } from '../../../API/NECAPI';

export default class NECProximitySensor implements IProximitySensor {

	private eventEmitter: EventEmitter;
	private lastDetected: boolean = false;

	constructor(private necAPI: INECAPI) {
		this.eventEmitter = new EventEmitter();
		this.pollStateChanges();
	}

	public addStateChangeListener(callback: (detected: boolean) => void): void {
		this.eventEmitter.addListener('change', callback);
	}

	public removeStateChangeListener(callback: (detected: boolean) => void): void {
		this.eventEmitter.removeListener('change', callback);
	}

	private pollStateChanges() {
		const POLL_INTERVAL = 4e3;
		setInterval(
			async () => {
				try {
					await this.executePollStateChanges();
				} catch (e) {
					// do nothing
				}
			},
			POLL_INTERVAL,
		);
	}

	@locked('proximity_sensor', { maxPending: 1 }) // only allow one at a time to prevent infinite stacking of tasks
	private async executePollStateChanges() {
		const detected = await this.necAPI.isHumanDetected();
		if (detected !== this.lastDetected) {
			this.eventEmitter.emit('change', detected);
			this.lastDetected = detected;
		}
	}
}
