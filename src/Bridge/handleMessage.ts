import { SystemReboot } from './bridgeMessages';
import * as SystemAPI from '../API/SystemAPI';

export class InvalidMessageError extends Error {}

export default async function handleMessage(message: { type: string }): Promise<object> {
	switch (message.type) {
		case SystemReboot:
			await SystemAPI.reboot();
			return {};

		default:
			throw new InvalidMessageError('invalid message type: ' + message.type);
	}
}
