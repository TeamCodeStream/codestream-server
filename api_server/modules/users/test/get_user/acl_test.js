'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');

class ACLTest extends CodeStreamAPITest {

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
		// create a user, then we'll try to fetch it ... but because we're not on a team together,
		// it should fail
		this.userFactory.createRandomUser((error, data) => {
			if (error) { return callback(error); }
			this.path = '/users/' + data.user._id;
			callback();
		});
	}
}

module.exports = ACLTest;
