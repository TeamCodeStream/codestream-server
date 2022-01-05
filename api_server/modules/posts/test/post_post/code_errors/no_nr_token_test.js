'use strict';

const CodeErrorTest = require('./code_error_test');
const Assert = require('assert');

class NoNRTokenTest extends CodeErrorTest {

	get description () {
		return 'should return an error with a needNRToken flag when trying to create and claim a code error but the user does not have a New Relic access token';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011',
			reason: 'user is not authorized to claim this code error for their team',
			info: {
				needNRToken: true
			}
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			delete this.apiRequestOptions.headers['X-CS-NewRelic-Secret'];
			callback();
		});
	}
}

module.exports = NoNRTokenTest;
