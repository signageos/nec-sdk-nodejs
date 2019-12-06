import { EventEmitter } from 'events';
import { locked } from '@signageos/front-display/es6/Lock/lockedDecorator';
import IProximitySensor from '@signageos/front-display/es6/NativeDevice/Sensors/IProximitySensor';
import NECPD from '@signageos/nec-sdk/dist/NECPD';
import Opcode from '@signageos/nec-sdk/dist/Opcode';
import { HumanSensorInstalledStatus, HumanSensorDetectionStatus } from '@signageos/nec-sdk/dist/constants';

export default class NECProximitySensor implements IProximitySensor {

	private eventEmitter: EventEmitter;
	private lastStatus: HumanSensorDetectionStatus = HumanSensorDetectionStatus.NOT_DETECTED;

	constructor(private necPD: NECPD) {
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
		const POLL_INTERVAL = 5e3;
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
		const sensorInstalled = await this.necPD.getParameter(Opcode.HUMAN_SENSOR_ATTACHMENT_STATUS);
		if (sensorInstalled === HumanSensorInstalledStatus.INSTALLED) {
			const status = await this.necPD.getParameter(Opcode.HUMAN_SENSOR_STATUS);
			if (status !== this.lastStatus) {
				const detected = status === HumanSensorDetectionStatus.DETECTED;
				this.eventEmitter.emit('change', detected);
				this.lastStatus = status;
			}
		}
	}
}
