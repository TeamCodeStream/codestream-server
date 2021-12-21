'use strict';

const ClaimCodeErrorTest = require('./claim_code_error_test');
const Assert = require('assert');

class NoNRTokenTest extends ClaimCodeErrorTest {

	get description () {
		return 'should return an unauthorized flag when trying to claim a code error but the user does not have a New Relic access token';
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			delete this.apiRequestOptions.headers['X-CS-NewRelic-Secret'];
			callback();
		});
	}

	validateResponse (data) {
		Assert.deepStrictEqual(data, { needNRToken:true }, 'response not correct');
	}
}

module.exports = NoNRTokenTest;
