
// The system status classess provide a mechanism for managing system statuses
// over time and providing the server-side services to execute the status
// checks. The checks are called 'watchers' and each has a given type. The type
// determins the logic used to conduct the check (a watcher function).
//
// Several status message profiles are available. (1) A 'history' of all the
// messages stored chronologically (includes both informational notices as well
// as alert conditions), (2) 'watcher statuses' which contains the current
// non-informational status of each watcher (one status per watcher) and (3)
// 'active alerts' (these also do not include notices) which contain only those
// alert conditions presnent now. 'Active alerts' are effectively a subset of
// 'watcher statuses'; specifically those with non-OK statuses. The worst of
// these are rolled up to determine the overall (aka global) system status.
//
// Watcher functions apply to the server-side process (systemStatusServices)
// where the status message profiles are available on both the client and
// server. Clients receive updates to their status message profiles via the
// socketIO service.

import Fs from 'fs';
import Hjson from 'hjson';
import { SystemStatuses } from '../src/store/actions/status';
import sortBy from '../src/lib/sortObjectListByProps';

const WatchInterval = 30000;
const watchers = {
	// a fake file watcher used in development. status are read from a json file
	fauxStatusFile: { // watcherId
		type: 'file',
		file: `${process.env.OPADM_TMP}/fauxStatusFile.json`,
		// msgId, (auto-generated, do not override)
		// lastCheck: Date.now(), (default)
		// status,
		// message,
	}
}

class systemStatus {
	constructor(options = {}) {
		this.logger = options.logger || console;
		this.io = options.io || null; // provide socketIO server if we want messages broadcasted
		this.watcherStatus = {};
		this.statusHistory = [];
		this._activeAlertsGetter();
		// this._systemStatusGetter();
		// this._systemStatusMsgGetter();
		Object.defineProperty(this, 'systemStatus', {
			get() {
				return this._systemStatus().status;
			},
		});
		Object.defineProperty(this, 'systemStatusMsg', {
			get() {
				return this._systemStatus().message;
			},
		});
	}

	// list of status (0 or 1 per watcher) that are not 'ok'
	_activeAlertsGetter() {
		Object.defineProperty(this, 'activeAlerts', {
			get() {
				const activeAlerts = [];
				for (const watcherId in this.watcherStatus) {
					const watcherInfo = this.watcherStatus[watcherId];
					if (watcherInfo.status !== SystemStatuses.notice && watcherInfo.status !== SystemStatuses.ok) {
						activeAlerts.push(watcherInfo);
					}
				}
				activeAlerts.sort(sortBy({ name: 'msgId', reverse: true, primer: parseInt }));
				return activeAlerts;
			},
		});
	}

	// return true if alertA is worse than alertB
	// Neither alertA nor alertB can be 'notice'
	_statusIsWorseThan(alertA, alertB) {
		const statusRank = {};
		statusRank[SystemStatuses.ok] = 0;
		statusRank[SystemStatuses.pending] = 1;
		statusRank[SystemStatuses.attention] = 2;
		// to be greater than is to be worse than
		return statusRank[alertA] > statusRank[alertB];
	}

	// the overall system status is the worst status of all the active alerts
	_systemStatus() {
		let systemStatus = SystemStatuses.ok;
		let alertCount = 0;
		this.activeAlerts.forEach((a) => {
			if (a.status !== SystemStatuses.ok) {
				alertCount += 1;
				if (this._statusIsWorseThan(a.status, systemStatus)) {
					systemStatus = a.status;
				}
			}
		});
		return {
			status: systemStatus,
			message: systemStatus !== SystemStatuses.ok ? `${alertCount} alerts outstanding` : null,
		};
	}

	_broadcastStatusMessage(data) {
		if (this.io) {
			this.io.emit('statusMessage', data);
		}
	}

	broadcastSystemStatus() {
		if (this.io) {
			this.io.emit('systemStatus', {
				status: this.systemStatus,
				message: this.systemStatusMsg,
				alerts: this.activeAlerts,
			});
		}
	}

	_watcherStatusChanged(statusInfo) {
		return statusInfo.status !== this.watcherStatus[statusInfo.watcherId].status || statusInfo.message !== this.watcherStatus[statusInfo.watcherId].message;
	}

	async _update(statusData) {
		const statusInfo = Object.assign({}, { ...statusData, msgId: (Date.now() + Math.random()).toString() });
		let broadcast = false;
		if (!statusInfo.lastCheck) {
			statusInfo.lastCheck = Date.now();
		}
		if (statusInfo.status == SystemStatuses.notice) {
			this.statusHistory.unshift(statusInfo);
			this._broadcastStatusMessage({ ...statusInfo, msgType: 'add' });
		}
		else if (statusInfo.watcherId) {
			if (statusInfo.watcherId in this.watcherStatus) {
				// console.log(this.watcherStatus);
				if (this._watcherStatusChanged(statusInfo)) {
					// watcher status has changed since the last interval
					this.logger.log(`watcher ${statusInfo.watcherId} status has changed - ${statusInfo.message}`, null, statusInfo);
					this.statusHistory.unshift(statusInfo);
					broadcast = true;
				}
			} else {
				// First status report for the watcher
				this.logger.log(`watcher ${statusInfo.watcherId} first status`, null, statusInfo);
				this.statusHistory.unshift(statusInfo);
				broadcast = true;
			}
			this.watcherStatus[statusInfo.watcherId] = statusInfo;
		}
		else {
			// we cannot generate an alert on a watcher that does not exist
			this.logger.error(`serverStatus._update(): watcherId not specified for status ${statusInfo.status}`);
		}
		if (broadcast) {
			this._broadcastStatusMessage({ ...statusInfo, msgType: 'add' });
			this.broadcastSystemStatus();
		}
		// console.log("leaving _update", statusInfo);
	}

	async notify(message, watcherId = null, lastCheck = Date.now()) {
		this.logger.info(`systemStatus notify: watcherId=${watcherId}, msg=${message}`);
		await this._update({ status: SystemStatuses.notice, message, lastCheck, watcherId });
		// console.log("leaving notify", message);
	}

	deleteWatcherAlerts(watcherId) {
		if (this.watcherStatus[watcherId].status !== SystemStatuses.ok) {
			// global system status may change
			this.broadcastSystemStatus();
		}
		delete this.watcherStatus[watcherId];
		this.notify(`watcher ${watcherId} stopped`, watcherId);
	}
}

class systemStatusService extends systemStatus {
	watchFile(watcherId) {
		// the file watcher reads its data from a json file with the properties
		// 'status' and 'statusMsg'
		this.logger.debug(`watching ${watcherId}`);
		const watcher = watchers[watcherId];
		const newWatchData = { watcherId };
		if (Fs.existsSync(watcher.file)) {
			const data = Hjson.parse(Fs.readFileSync(watcher.file, 'utf8'));
			newWatchData.status = data.status;
			newWatchData.message = data.message;
			newWatchData.lastCheck = data.lastCheck || parseInt(Fs.statSync(watcher.file).mtimeMs);
		}
		else {
			newWatchData.status = SystemStatuses.pending;
			newWatchData.message = `watched file ${watcher.file} does not exist`;
			newWatchData.lastCheck = Date.now();
		}
		this._update(newWatchData);
	}

	start() {
		(async () => {
			await this.notify('System status monitor starting up');
			this.logger.info('watchers -', watchers);
			for (const watcherId in watchers) {
				this.logger.info(`watcher id = ${watcherId}`);
				switch (watchers[watcherId].type) {
					case 'file':
						this.logger.info('case file');
						watchers[watcherId].intervalTimer = setInterval(() => {
							this.watchFile(watcherId);
						}, WatchInterval - 1000);
						break;
					default:
						this.logger.error(`unknown watcher type: ${watcher[watcherId].type}`);
						return;
				}
				await this._update({ status: SystemStatuses.pending, message: `${watcherId} watcher starting up`, watcherId });
			};
		})();
	}

	stop() {
		this.notify('System status monitor shutting down');
		Object.keys(watchers).forEach((watcherId) => {
			const watcher = watchers[watcherId];
			if (watcher.intervalTimer) {
				this.logger.info(`clearing watcher id ${watcherId}`);
				clearInterval(intervalTimer);
				delete watcher.intervalTimer;
				this.deleteWatcherAlerts(watcherId);
			}
		});
	}
}

const systemStatusFactory = (options) => {
	const logger = options.logger || console;
	const statusMonitor = new systemStatusService(options);
	statusMonitor.start();
	return statusMonitor;
}

export default systemStatusFactory;
