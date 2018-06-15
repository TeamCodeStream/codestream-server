'use strict';

const PutUserTest = require('./put_user_test');

class NoCodestreamUsernameTest extends PutUserTest {

	get description () {
		return 'should return an error when user is trying to update their username to "codestream"';
	}

	getExpectedError () {
		return {
			code: 'TEAM-1000'
		};
	}

	// before the test runs...
	before (callback) {
		// substitute "codestream" username, which is not allowed
		super.before(error => {
			if (error) { return callback(error); }
			this.data.username = 'codestream';
			callback();
		});
	}
}

module.exports = NoCodestreamUsernameTest;
