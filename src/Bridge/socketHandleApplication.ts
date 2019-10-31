import { ISocket } from '@signageos/lib/dist/WebSocket/socketServer';
import { SECOND_IN_MS } from '@signageos/lib/dist/DateTime/millisecondConstants';
import { NotifyApplicationAlive } from './bridgeSystemMessages';
import { ISystemAPI } from '../API/SystemAPI';
import * as Debug from 'debug';
const debug = Debug('@signageos/display-linux:Bridge:socketHandleApplication');

const RESTART_TIMEOUT = 60 * SECOND_IN_MS;

let restartAppTimeout: NodeJS.Timer | null = null;

export default function socketHandleApplication(socket: ISocket, systemAPI: ISystemAPI) {
	resetRestartTimeout(systemAPI);
	socket.bindMessage(NotifyApplicationAlive, () => {
		debug('application alive');
		resetRestartTimeout(systemAPI);
	});
}

function resetRestartTimeout(systemAPI: ISystemAPI) {
	if (restartAppTimeout !== null) {
		clearTimeout(restartAppTimeout);
	}

	restartAppTimeout = setTimeout(
		async () => {
			debug('application not responding, restarting now');
			await systemAPI.restartApplication();
		},
		RESTART_TIMEOUT,
	);
}
