import { ISystemAPI } from '../API/SystemAPI';
import { SECOND_IN_MS } from '@signageos/lib/dist/DateTime/millisecondConstants';
import * as Debug from 'debug';

const debug = Debug('@signageos/display-linux:Application/ClientWatchdog');

export default class ClientWatchdog {

	private lastAlive: number = new Date().valueOf();
	private pendingTasks: number = 0;

	constructor(private systemAPI: ISystemAPI) {
		this.initInterval();
	}

	public notifyAlive() {
		debug('application alive');
		this.restartTimer();
	}

	public notifyPendingTask() {
		this.pendingTasks++;
		debug(`there's ${this.pendingTasks} pending tasks`);
	}

	public notifyPendingTaskFinished() {
		this.pendingTasks = Math.max(0, this.pendingTasks - 1); // prevent negative numbers
		debug(`there's ${this.pendingTasks} pending tasks`);
	}

	private initInterval() {
		setInterval(
			async () => {
				if (this.isApplicationDead() && this.pendingTasks === 0) {
					debug('application not responding, restarting now');
					this.restartTimer();
					await this.systemAPI.restartApplication();
				}
			},
			1e3,
		);
	}

	private restartTimer() {
		this.lastAlive = new Date().valueOf();
	}

	private isApplicationDead() {
		const RESTART_AFTER_MS = 60 * SECOND_IN_MS;
		const now = new Date().valueOf();
		const lastAliveMsAgo = now - this.lastAlive;
		return lastAliveMsAgo >= RESTART_AFTER_MS;
	}
}
