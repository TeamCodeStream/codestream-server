'use strict';

var SlackEnableTest = require('./slack_enable_test');

class ACLTest extends SlackEnableTest {

	get description () {
		return 'should return an error when trying to send a slack enable request with an incorrect secret';
	}

	getExpectedError () {
		return {
			code: 'INTG-1001',
		};
	}

	// before the test runs...
	before (callback) {
		// call standard setup, but then remove the secret
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data.secret;
			callback();
		});
	}
}

module.exports = ACLTest;
