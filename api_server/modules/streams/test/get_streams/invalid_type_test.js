'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');

class InvalidTypeTest extends CodeStreamAPITest {

	get description () {
		return 'should return error if an invalid type is provided in the query';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1006',
			reason: 'invalid stream type'
		};
	}

	// before the test runs...
	before (callback) {
		// we're skipping the usual test conditions here, so just create a random repo,
		// which creates a team ... then try to fetch a stream from that team using a bogus type
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				let teamId = response.team._id;
				this.path = `/streams?teamId=${teamId}&type=sometype`;
				callback();
			},
			{
				token: this.token	// the current user creates the repo and team
			}
		);
	}
}

module.exports = InvalidTypeTest;
