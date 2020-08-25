'use strict';

const PresenceTest = require('./presence_test');
const Assert = require('assert');

class AwayTimeoutResponseTest extends PresenceTest {

	constructor (options) {
		super(options);
		// normally we verify by fetching the session data, but here we want the response to the presence request
		this.dontFetchToVerify = true;
	}

	get description () {
		return 'should return the away timeout in the response';
	}

	// validate the response to the test request
	validateResponse (data) {
		// verify we got an awayTimeout ... this is important for the client to know
		// what the value is for continuing confirmation of their online status
		Assert.equal(data.awayTimeout, this.apiConfig.apiServer.sessionAwayTimeout, 'returned away timeout not correct');
	}
}

module.exports = AwayTimeoutResponseTest;
