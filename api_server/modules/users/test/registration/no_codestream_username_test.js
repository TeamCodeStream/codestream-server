'use strict';

const RegistrationTest = require('./registration_test');

class NoCodestreamUsernameTest extends RegistrationTest {

	get description () {
		return 'should return an error when attempting to register a user with "codestream" username';
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
