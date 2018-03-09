'use strict';

const PresenceTest = require('./presence_test');
const ApiConfig = require(process.env.CS_API_TOP + '/config/api');
const Assert = require('assert');

class AwayTimeoutResponseTest extends PresenceTest {

	constructor (options) {
		super(options);
		this.dontFetchToVerify = true;
	}

	get description () {
		return `should return the away timeout in the response`;
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.equal(data.awayTimeout, ApiConfig.sessionAwayTimeout, 'returned away timeout not correct');
	}
}

module.exports = AwayTimeoutResponseTest;
