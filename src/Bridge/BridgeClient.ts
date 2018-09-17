import * as AsyncLock from 'async-lock';
import ISocket from '@signageos/front-display/es6/Socket/ISocket';
import Orientation from '@signageos/front-display/es6/NativeDevice/Orientation';
import BridgeVideoClient from './BridgeVideoClient';

export default class BridgeClient {

	public video: BridgeVideoClient;

	constructor(
		private serverUri: string,
		public readonly socketClient: ISocket,
	) {}

	public initialize(window: Window, getOrientation: () => Orientation, lock: AsyncLock) {
		this.video = new BridgeVideoClient(window, getOrientation, lock, this.socketClient);
	}

	public async invoke<TMessage extends { type: string }, TResult>(message: TMessage): Promise<TResult> {
		const response = await fetch(
			this.serverUri + '/message',
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(message),
			},
		);

		if (!response.ok) {
			throw new Error('bridge invoke failed with status code ' + response.status);
		}

		return await response.json();
	}
}
