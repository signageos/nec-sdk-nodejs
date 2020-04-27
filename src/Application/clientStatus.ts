import { SECOND_IN_MS } from '@signageos/lib/dist/DateTime/millisecondConstants';

export async function notifyClientAlive(serverUri: string) {
	const NOTIFY_ALIVE_INTERVAL = 10 * SECOND_IN_MS;
	await setNotifyAliveToSocket(serverUri);
	setInterval(
		() => setNotifyAliveToSocket(serverUri),
		NOTIFY_ALIVE_INTERVAL,
	);
}

async function setNotifyAliveToSocket(serverUri: string) {
	await fetch(serverUri + '/client-alive', { method: 'POST' });
}
