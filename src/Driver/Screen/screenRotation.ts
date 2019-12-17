import { ScreenRotationManager } from '@signageos/front-display/es6/NativeDevice/Screen/screenRotation';
import Orientation from '@signageos/front-display/es6/NativeDevice/Orientation';
import * as ScreenMessages from '../../Bridge/bridgeScreenMessages';
import PrivateOrientation from '../Orientation';
import BridgeClient from '../../Bridge/BridgeClient';

export class FrontScreenRotationManager extends ScreenRotationManager {

	private orientation: Orientation | null = null;

	constructor(
		storage: Storage,
		elements: HTMLElement[],
		private bridge: BridgeClient,
	) {
		super(storage, elements);
	}

	public async getCurrentOrientation() {
		if (this.orientation === null) {
			const { orientation } = await this.bridge.invoke<ScreenMessages.GetOrientation, { orientation: PrivateOrientation }>({
				type: ScreenMessages.GetOrientation,
			});
			this.orientation = Orientation[orientation as keyof typeof Orientation];
		}

		return this.orientation;
	}

}
