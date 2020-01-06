import { ISystemAPI } from '../API/SystemAPI';

const NOTIFY_INTERVAL = 5e3;

let interval: any = null;

export async function notifyServerAlive(systemAPI: ISystemAPI) {
	await systemAPI.applicationNotifyAlive();
	if (!interval) {
		interval = setInterval(() => systemAPI.applicationNotifyAlive(), NOTIFY_INTERVAL);
	}
}

export async function notifyServerStopped(systemAPI: ISystemAPI) {
	if (interval) {
		clearInterval(interval);
		interval = null;
	}
	await systemAPI.applicationNotifyStopped();
}
