'use strict';

const ConfirmationTest = require('./confirmation_test');

class NoCodestreamUsernameTest extends ConfirmationTest {

	get description () {
		return 'should return an error when attempting to confirm a user with "codestream" username';
	}

	getExpectedError () {
		return {
			code: 'TEAM-1000',
		};
	}

	// before the test runs...
	before (callback) {
		// substitute username "codestream", which is not allowed
		super.before(error => {
			if (error) { return callback(error); }
			this.data.username = 'codestream';
			callback();
		});
	}

}

module.exports = NoCodestreamUsernameTest;
