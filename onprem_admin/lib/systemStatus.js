
import { timingSafeEqual } from 'crypto';
import Fs, { watch } from 'fs';
import Hjson from 'hjson';
import { worstStatus, SystemStatuses } from '../src/store/actions/status';

const WatchInterval = 10000;
const watchers = {
	fauxStatusFile: {
		type: 'file',
		name: `${process.env.OPADM_TMP}/fauxStatusFile.json`,
		// lastCheck: Date.now(),
		// status,
		// statusMsg,
	}
}

class systemStatus {
	constructor(options={}) {
		this.logger = options.logger || console;
		this.systemStatus = SystemStatuses.pending;
		this.systemStatusMsg = 'System status monitor starting up',
		this.watchers = Object.assign({}, watchers);
	}

	rollUpStatuses() {
		this.logger.debug('rollUpStatuses');
		let probWatchers = 0;
		let newSystemStatus = SystemStatuses.ok;
		const numWatchers = Object.keys(this.watchers).length;
		Object.keys(this.watchers).forEach((watcherId) => {
			const watcher = this.watchers[watcherId];
			if (!watcher.status) {
				watcher.status = SystemStatuses.pending;
				watcher.statusMsg = `${watcherId} pending first watch`;
				probWatchers += 1;
			}
			newSystemStatus = worstStatus(newSystemStatus, watcher.status);
		});
		this.systemStatus = newSystemStatus;
		this.systemStatusMsg = !probWatchers ? '' : `${probWatchers} of ${numWatchers} watchers have problems`;
		this.logger.log(`systemStatus: ${this.systemStatus} - ${this.systemStatusMsg}`);
	}

	watchFile(watcherId) {
		console.log(`watching ${watcherId}`);
		const watcher = this.watchers[watcherId];
		watcher.lastCheck = Date.now();
		if (Fs.existsSync(watcher.name)) {
			const data = Hjson.parse(Fs.readFileSync(watcher.name, 'utf8'));
			watcher.status = data.status;
			watcher.statusMsg = data.statusMsg || '';
		}
		else {
			watcher.status = SystemStatuses.pending;
			watcher.statusMsg = `watch file ${watcher.name} does not exist`;
		}
		console.log(`watchingFile(${watcher.name}). Status: ${watcher.status}`)
		console.log(`status msg: ${watcher.statusMsg}`);
		this.rollUpStatuses();
	}

	start() {
		console.log('system status monitor is starting up...');
		console.log('this.watchers -', this.watchers);
		Object.keys(this.watchers).forEach(watcherId => {
			console.log(`watcher id ${watcherId}`);
			switch (this.watchers[watcherId].type) {
				case 'file':
					console.log('case file');
					this.watchers[watcherId].intervalTimer = setInterval(() => {
						this.watchFile(watcherId);
					}, WatchInterval-1000);
					break;
				default:
					this.logger.error(`unknown watcher type: ${watcher[watcherId].type}`);
			}
		});
	}

	stop() {
		console.log('system status monitor is shutting down...');
		Object.keys(this.watchers).forEach((watcherId) => {
			const watcher = this.watchers[watcherId];
			if (watcher.intervalTimer) {
				console.log(`clearing watcher id ${watcherId}`);
				clearInterval(intervalTimer);
				delete watcher.intervalTimer;
			}
		});

	}
}

const systemStatusFactory = (options) => {
	const statusMonitor = new systemStatus(options);
	console.log('sysstat fact:', statusMonitor.systemStatus);
	statusMonitor.start();
	return statusMonitor;
}
export default systemStatusFactory;
