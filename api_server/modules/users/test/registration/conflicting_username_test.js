'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');

class ConflictingUsernameTest extends CodeStreamAPITest {

	get description () {
		return 'should return an error when attempting to register a user with a username that is already taken on the team';
	}

	get method () {
		return 'post';
	}

	get path () {
		return '/no-auth/register';
	}

	getExpectedError () {
		return {
			code: 'TEAM-1000',
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data = this.userFactory.getRandomUserData();
			this.data.email = this.users[2].user.email;
			this.data.username = this.users[1].user.username;
			callback();
		});
	}
}

module.exports = ConflictingUsernameTest;
