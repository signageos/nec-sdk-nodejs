import { ISystemAPI } from '../API/SystemAPI';
import { SECOND_IN_MS } from '@signageos/lib/dist/DateTime/millisecondConstants';
import * as Debug from 'debug';

const debug = Debug('@signageos/display-linux:Application/ClientWatchdog');

export default class ClientWatchdog {

	private timeout: any = null;
	private pendingTasks: number = 0;

	constructor(private systemAPI: ISystemAPI) {
		this.initTimeout();
	}

	public notifyAlive() {
		debug('application alive');
		if (this.timeout) {
			clearTimeout(this.timeout);
			this.timeout = null;
		}
		if (!this.isPaused()) {
			debug('resetting timer');
			this.initTimeout();
		} else {
			debug(`watchdog paused because there are ${this.pendingTasks} pending tasks`);
		}
	}

	public notifyPendingTask() {
		if (this.timeout) {
			clearTimeout(this.timeout);
			this.timeout = null;
		}
		this.pendingTasks++;
	}

	public notifyPendingTaskFinished() {
		this.pendingTasks--;
		if (!this.isPaused()) {
			this.initTimeout();
		}
	}

	private isPaused() {
		return this.pendingTasks > 0;
	}

	private initTimeout() {
		const RESTART_TIMEOUT = 60 * SECOND_IN_MS;
		this.timeout = setTimeout(
			async () => {
				debug('application not responding, restarting now');
				await this.systemAPI.restartApplication();
			},
			RESTART_TIMEOUT,
		);
	}
}
