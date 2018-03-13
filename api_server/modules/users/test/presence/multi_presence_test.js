'use strict';

const PresenceTest = require('./presence_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const UUID = require('uuid/v4');

class MultiPresenceTest extends PresenceTest {

	get description () {
		return 'should set session data for the session when presence is updated, even if other presence information has already been set';
	}

	// before the test runs...
	before (callback) {
		// set some additional presence data before the standard setup
		BoundAsync.series(this, [
			this.setOtherPresenceData,
			super.before
		], callback);
	}

	// set other presence data to precede the presence data for the test
	setOtherPresenceData (callback) {
		BoundAsync.times(
			this,
			3,
			this.setSinglePresenceData,
			callback
		);
	}

	// set some presence data for a single session
	setSinglePresenceData (n, callback) {
		const data = {
			sessionId: UUID(),
			status: 'away'
		};
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
}

module.exports = MultiPresenceTest;
