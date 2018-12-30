import { ISocket } from '@signageos/lib/dist/WebSocket/socketServer';
import { SECOND_IN_MS } from '@signageos/lib/dist/DateTime/millisecondConstants';
import { NotifyApplicationAlive } from './bridgeSystemMessages';
import { restartApplication } from '../API/SystemAPI';

const RESTART_TIMEOUT = 60 * SECOND_IN_MS;

let restartAppTimeout: NodeJS.Timer | null = null;

export default function socketHandleApplication(socket: ISocket) {
	resetRestartTimeout();
	socket.on(NotifyApplicationAlive, () => {
		resetRestartTimeout();
	});
}

function resetRestartTimeout() {
	if (restartAppTimeout !== null) {
		clearTimeout(restartAppTimeout);
	}

	restartAppTimeout = setTimeout(
		() => restartApplication(),
		RESTART_TIMEOUT,
	);
}
