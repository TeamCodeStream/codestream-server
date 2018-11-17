'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');

class ACLTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.teamOptions.members = [];
	}

	get description () {
		return 'should return an error when trying to fetch a user not on a team that i\'m not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.otherUser = this.users[1].user;
			this.path = '/users/' + this.otherUser.id;
			callback();
		});
	}
}

module.exports = ACLTest;
