
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
import Path from 'path';
import Hjson from 'hjson';
import axios from 'axios';
import { SystemStatuses } from '../src/store/actions/status';
import sortBy from '../src/lib/sortObjectListByProps';

const WatchInterval = 30000;

// maybe this should be defined in config??
const getWatchers = (config, installation) => {
	const watchers = {};
	if (installation.productType === 'On-Prem Development') {
		// a fake file watcher used in development. status, lastCheck and message are read from a json file
		watchers.fauxStatusFile = {
			// watcherId
			type: 'file',
			warnTimeOut: 65,
			attnTimeOut: 125, // seconds
			file: `${process.env.OPADM_TMP}/fauxStatusFile.json`,
			// msgId, (auto-generated, do not override)
			// lastCheck: Date.now(), (default)
			// status,
			// message,
		};
	}
	// get assetInfo from API
	watchers.apiAssetInfo = {
		type: 'assetInfo',
		url: `${config.apiServer.publicApiUrl}/no-auth/asset-info`,
		serviceName: 'api-server'
	};
	if (config.broadcastEngine.selected === 'codestreamBroadcaster') {
		// get assetInfo from broadcaster
		watchers.broadcastAssetInfo = {
			type: 'assetInfo',
			url: `${config.broadcastEngine.codestreamBroadcaster.ignoreHttps ? 'http' : 'https'}://${config.broadcastEngine.codestreamBroadcaster.host}:${config.broadcastEngine.codestreamBroadcaster.port}/no-auth/asset-info`,
			serviceName: 'broadcaster'
		}
	};
	return watchers;
};

class systemStatus {
	constructor(config, installation, options = {}) {
		this.config = config;
		this.installation = installation;	// asset info returned from watchers will be added to this object
		this.logger = options.logger || console;
		this.io = options.io || null; // provide socketIO server if we want messages broadcasted
		this.watcherStatus = {};
		this.statusHistory = [];
		this.watchers = getWatchers(this.config, this.installation);
		this._activeAlertsGetter();
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

	_broadcastMessage(msgType, data) {
		if (this.io) {
			this.io.emit(msgType, data);
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

	// process a status update. This involves assigning an id (msgId), detecting
	// any change in system status, adding the message to the message history
	// and broadcasting any new information if need be.
	async _update(statusData) {
		const statusInfo = Object.assign({}, { ...statusData, msgId: (Date.now() + Math.random()).toString() });
		let broadcast = false;
		if (!statusInfo.lastCheck) {
			statusInfo.lastCheck = Date.now();
		}
		if (statusInfo.status == SystemStatuses.notice) {
			this.statusHistory.unshift(statusInfo);
			this._broadcastMessage('statusMessage', { ...statusInfo, msgType: 'add' });
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
			this._broadcastMessage('statusMessage', { ...statusInfo, msgType: 'add' });
			this.broadcastSystemStatus();
			if (statusData.serviceName) {
				this._broadcastMessage('assetUpdate', { serviceName: statusData.serviceName, fullName: statusData.fullName });
			}
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
		const watcher = this.watchers[watcherId];
		this.logger.debug(`watching file ${watcher.file} for ${watcherId}`);
		const newWatchData = { watcherId };
		const now = Date.now();
		const fileTime = parseInt(Fs.statSync(watcher.file).mtimeMs);
		const fileAgeInSecs = parseInt((now - fileTime) / 1000);
		if (fileAgeInSecs > (watcher.attnTimeOut || 125)) {
			// file hasn't been updated in a while
			newWatchData.status = SystemStatuses.attention;
			newWatchData.message = `watched file ${Path.basename(watcher.file)} hasn't been updated in ${parseInt(fileAgeInSecs / 60)} minutes`;
			newWatchData.lastCheck = now;
		}
		else if (fileAgeInSecs > (watcher.warnTimeOut || 65)) {
			// file hasn't been updated in a while
			newWatchData.status = SystemStatuses.pending;
			newWatchData.message = `watched file ${Path.basename(watcher.file)} hasn't been updated in ${parseInt(fileAgeInSecs / 60)} minutes`;
			newWatchData.lastCheck = now;
		}
		else if (Fs.existsSync(watcher.file)) {
			const data = Hjson.parse(Fs.readFileSync(watcher.file, 'utf8'));
			newWatchData.status = data.status;
			newWatchData.message = data.message;
			newWatchData.lastCheck = data.lastCheck || fileTime;
		}
		else {
			// warning state if file does not exist
			newWatchData.status = SystemStatuses.pending;
			newWatchData.message = `watched file ${watcher.file} does not exist`;
			newWatchData.lastCheck = now;
		}
		this._update(newWatchData);
	}

	fetchAssetInfo(watcherId) {
		// the assetInfo watcher fetches asset info data from a target service via
		// an http(s) call.
		const watcher = this.watchers[watcherId];
		this.logger.debug(`watching assetInfo for ${watcherId} at ${watcher.url}`);
		const newWatchData = { watcherId };
		const now = Date.now();
		(async () => {
			try {
				const res = await axios.get(watcher.url);
				this.logger.debug(`fetch ${watcher.url} returned`, null, res.data);
				const fullName = res.data.assetInfo?.fullName ? res.data.assetInfo.fullName : 'development sandbox';
				newWatchData.status = SystemStatuses.ok;
				newWatchData.message = `${watcher.serviceName} service: ${fullName}`;
				newWatchData.lastCheck = now;
				newWatchData.serviceName = watcher.serviceName;
				newWatchData.fullName = fullName;
				// update the global installation object
				this.installation.assetInfo[watcher.serviceName] = fullName;
			} catch (error) {
				newWatchData.status = SystemStatuses.attention;
				newWatchData.message = `request of asset info failed with ${error}`;
				newWatchData.lastCheck = now;
			}
			this._update(newWatchData);
		})();
	}

	start() {
		(async () => {
			await this.notify('System status monitor starting up');
			this.logger.info('watchers -', this.watchers);
			for (const watcherId in this.watchers) {
				this.logger.info(`watcher id = ${watcherId}`);
				switch (this.watchers[watcherId].type) {
					case 'file':
						this.logger.info('watching file');
						this.watchers[watcherId].intervalTimer = setInterval(() => {
							this.watchFile(watcherId);
						}, WatchInterval - 1000);
						break;
					case 'assetInfo':
						this.logger.info('watching assetInfo');
						this.watchers[watcherId].intervalTimer = setInterval(() => {
							this.fetchAssetInfo(watcherId);
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
		Object.keys(this.watchers).forEach((watcherId) => {
			const watcher = this.watchers[watcherId];
			if (watcher.intervalTimer) {
				this.logger.info(`clearing watcher id ${watcherId}`);
				clearInterval(intervalTimer);
				delete watcher.intervalTimer;
				this.deleteWatcherAlerts(watcherId);
			}
		});
	}
}

const systemStatusFactory = (config, installation, options) => {
	const statusMonitor = new systemStatusService(config, installation, options);
	statusMonitor.start();
	return statusMonitor;
}

export default systemStatusFactory;
