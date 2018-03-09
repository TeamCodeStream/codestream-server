'use strict';

const PresenceTest = require('./presence_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const UUID = require('uuid/v4');
const Assert = require('assert');

class StalePresenceRemovalTest extends PresenceTest {

	constructor (options) {
		super(options);
		this.awayTimeout = 6000;	// we'll rush the away timeout for testing purposes
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			this.setStalePresenceData,	// write some presence data which will be found to be stale during the test
			this.wait,					// wait a bit for the stale presence data to start getting stale...
			this.setFreshPresenceData,	// set some more presence data that will still be fresh for the test
			this.wait,					// wait some more for the stale presence data to truly become stale
			super.before				// run standard test, setting more presence data ... during this, the stale data should be removed
		], callback);
	}

	// set presence data which will become stale over the course of the test
	setStalePresenceData (callback) {
		this.stalePresenceData = {
			sessionId: UUID(),
			status: 'online'
		};
		this.savePresence(this.stalePresenceData, callback);
	}

	// wait for the presence data to start becoming stale, and then when it is
	// called a second time, to really become stale
	wait (callback) {
		setTimeout(callback, this.awayTimeout / 3 * 2);
	}

	// set presence data for a session which will stay fresh for the test
	setFreshPresenceData (callback) {
		this.freshPresenceData = {
			sessionId: UUID(),
			status: 'away'
		};
		this.savePresence(this.freshPresenceData, callback);
	}

	// save some presence data for a session
	savePresence (data, callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/presence',
				data: data,
				token: this.token
			},
			callback
		);
	}

	// set presence data to use during the test
	setPresenceData (callback) {
		// standard presence data, but add a mock away timeout, to rush the test
		super.setPresenceData(() => {
			this.presenceData._awayTimeout = this.awayTimeout;
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		// validate that we don't see the data that became stale in the returned sessions,
		// but we should still see the fresh data, in addition to the actual test data
		const sessions = data.sessions;
		Assert(typeof sessions[this.stalePresenceData.sessionId] === 'undefined', 'stale session data persisted');
		Assert(sessions[this.freshPresenceData.sessionId].status === this.freshPresenceData.status, 'fresh presence data is not correct');
		super.validateResponse(data);
	}
}

module.exports = StalePresenceRemovalTest;
