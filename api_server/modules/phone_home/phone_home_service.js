// provides the phone-home service to send periodic stats updates back to our cloud server
// for on-prem installations

'use strict';

const PhoneHomeStatsCollector = require('./phone_home_stats_collector');
const Fetch = require('node-fetch');

const ONE_MINUTE = 60 * 1000;
const ONE_HOUR = 60 * ONE_MINUTE;
const ONE_DAY = 24 * ONE_HOUR;
const SIX_HOURS = 6 * ONE_HOUR;
const SIX_SECONDS = 6 * 1000;

class PhoneHomeService {

	constructor (options) {
		Object.assign(this, options);
	}

	// initiate the nightly phone home
	initiate () {
		this.setNextTimer();
	}

	// run the phone-home right now, for testing
	async run () {
		delete this.error;
		await this.setNextTimer(true);
		if (this.error) {
			throw this.error;
		}
	}

	// set next timer for phone home
	async setNextTimer (isOnDemand) {
		const runEveryMinute = process.env.CS_API_PHONE_HOME_EVERY_MINUTE;

		// we'll do it at 6ish AM GMT, which corresponds to 2 AM ET or 1 AM ET, depending on DST,
		// either one is good enough, note that we randomize on the Ginterval we wait to avoid
		// contention with other workers
		const now = Date.now();
		const runInterval = runEveryMinute ? ONE_MINUTE : ONE_DAY;
		const runOffset = runEveryMinute ? SIX_SECONDS : SIX_HOURS;
		const intervalText = runEveryMinute ? 'minute' : 'day';
		const intervalBegin = now - (now % runInterval);

		if (isOnDemand) {
			this.api.log(`Phoning home on-demand for ${intervalText} of ${intervalBegin}...`);
			return await this.dumpAndTransmitStats(intervalBegin, runInterval, intervalText, true);
		}

		const runAt = intervalBegin + runInterval + runOffset;
		const tillNext = runAt - now;
		const randomizeInterval = runEveryMinute ? SIX_SECONDS : ONE_HOUR;
		let timerInterval = tillNext + Math.floor(Math.random() * randomizeInterval); // randomize to avoid contention
		if (timerInterval < SIX_SECONDS) {
			timerInterval = SIX_SECONDS;	// give at least six seconds for any initialization to happen
		}
		this.api.log(`Will attempt to phone home for ${intervalText} of ${intervalBegin} in ${timerInterval} ms...`);
		this.nextTimer = setTimeout(this.phoneHome.bind(this), timerInterval, intervalBegin, runInterval, intervalText, isOnDemand);
	}

	// phone home has been triggered, collect and dump the stats, then transmit
	async phoneHome (intervalBegin, interval, intervalText) {
		this.api.log(`Attempting to phone home for ${intervalText} of ${intervalBegin}...`);
		if (!await this.grabJob(intervalBegin)) { // make sure we are the only worker doing this job
			this.api.log('Will not phone home, another worker got this job');
			return this.setNextTimer();
		}
		await this.dumpAndTransmitStats(intervalBegin, interval);
		await this.removeOldJobs();
		this.setNextTimer();
	}

	// do the actual work of dumping and transmitting stats
	async dumpAndTransmitStats (intervalBegin, interval) {
		await this.dumpStats(intervalBegin, interval);
		if (await this.transmit()) {
			await this.removeData();
		}
	}

	// grab the job to handle stats for this day, otherwise another worker grabbed it and we should back off
	async grabJob (intervalBegin) {
		let jobDoc;
		try {
			jobDoc = await this.api.data.phoneHomeJobs.findAndModify(
				{ id: intervalBegin },
				{ '$inc': { numWorkers: 1 } },
				{ upsert: true, returnOriginal: false }
			);
		}
		catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			this.error = `Caught error trying to claim phone-home job: ${message}`;
			this.api.warn(this.error);
			return false;
		}

		// if numWorkers is 1, we are the first to try and grab this job
		return jobDoc && jobDoc.value && jobDoc.value.numWorkers === 1;
	}

	// collect and dump stats for the previous 24-hour period
	async dumpStats (intervalBegin, interval) {
		try {
			this.api.log(`Collecting stats for phone-home, intervalBegin=${intervalBegin}...`);
			await new PhoneHomeStatsCollector({
				api: this.api
			}).collectAndDumpStats(intervalBegin, interval);
		}
		catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			this.error = `Caught error collecting and dumping stats for phone-home: ${message}`;
			this.api.warn(this.error);
			if (error instanceof Error) {
				this.api.warn(error.stack);
			}
		}
	}

	// transmit any phone records found
	async transmit () {
		this.api.log('Checking for phone home data to transmit...');
		const phoneHomeData = await this.api.data.phoneHomeStats.getByQuery({}, { overrideHintRequired: true });
		if (phoneHomeData.length === 0) {
			this.api.log('No phone home data found');
			return;
		}

		if (phoneHomeData.length === 100) {
			this.api.warn('More than 100 phone home records found, will only transmit the last 100');
			phoneHomeData.splice(100);
		}

		this.api.log(`Transmitting ${phoneHomeData.length} phone home records: ${phoneHomeData.map(phd => phd.date)}`);
		const statsData = phoneHomeData.map(phd => phd.stats);
		const url = `${this.api.config.apiServer.phoneHomeUrl}/phone-home`;
		const phoneHomeKey = this.api.config.universalSecrets.telemetry;
		try {
			const response = await Fetch(url, {
				method: 'post',
				body: JSON.stringify(statsData),
				headers: { 
					'Content-Type': 'application/json',
					'X-CS-Phone-Home-Key': phoneHomeKey
				},
			});
			if (response.status !== 200) {
				throw 'invalid response: ' + response.status;
			}
			this.api.log(`Successfully transmitted ${phoneHomeData.length} phone home records`);
			return true;
		}
		catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			this.error = `Error transmitting phone home data: ${message}`;
			this.api.warn(this.error);
			return false;
		}
	}

	// remove the phone home records, since they have now been transmitted
	async removeData () {
		this.api.data.phoneHomeStats.deleteByQuery({});
	}

	// remove any old jobs from the record of claimed jobs ... basically anything older than the current job can be removed
	async removeOldJobs () {
		try {
			await this.api.data.phoneHomeJobs.deleteByQuery({
				id: { $lt: this.intevalBegin }
			});
		}
		catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			this.api.warn(`Unable to remove old phone-home jobs: ${message}`);
		}
	}
}

module.exports = PhoneHomeService;