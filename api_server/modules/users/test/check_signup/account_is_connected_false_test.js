'use strict';

const NoTeamsTest = require('./no_teams_test');
const Assert = require('assert');

class AccountIsConnectedFalseTest extends NoTeamsTest {

	get description () {
		return 'user should get a flag indicating their NR account is not connected to a company with response to check signup, when account ID is sent but no matching company is found';
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			// send a random account ID that won't match anything
			this.data.nrAccountId = this.codeErrorFactory.randomAccountId();
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.strictEqual(data.accountIsConnected, false, 'accountIsConnected should be false');
		super.validateResponse(data);
	}
}

module.exports = AccountIsConnectedFalseTest;
