import { ISocket } from '@signageos/lib/dist/WebSocket/socketServer';
import { SECOND_IN_MS } from '@signageos/lib/dist/DateTime/millisecondConstants';
import { NotifyApplicationAlive } from './bridgeSystemMessages';
import { restartApplication } from '../API/SystemAPI';
import * as Debug from 'debug';
const debug = Debug('@signageos/display-linux:Bridge:socketHandleApplication');

const RESTART_TIMEOUT = 60 * SECOND_IN_MS;

let restartAppTimeout: NodeJS.Timer | null = null;

export default function socketHandleApplication(socket: ISocket) {
	resetRestartTimeout();
	socket.bindMessage(NotifyApplicationAlive, () => {
		debug('application alive');
		resetRestartTimeout();
	});
}

function resetRestartTimeout() {
	if (restartAppTimeout !== null) {
		clearTimeout(restartAppTimeout);
	}

	restartAppTimeout = setTimeout(
		async () => {
			debug('application not responding, restarting now');
			await restartApplication();
		},
		RESTART_TIMEOUT,
	);
}
