'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');

class NoRepo_IDTest extends CodeStreamAPITest {

	get description () {
		return 'should return error if a no repo ID is provided in the query for file streams';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1006',
			reason: 'queries for file streams require repoId'
		};
	}

	// before the test runs...
	before (callback) {
		// we're skipping the usual test conditions here, so just create a random repo,
		// which creates a team ... then try to fetch file-type streams from that team ...
		// it is not allowed to fetch file-type streams spanning the repos in a team, 
		// so this should fail
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				let teamId = response.team._id;
				this.path = `/streams?teamId=${teamId}&type=file`;
				callback();
			},
			{
				token: this.token	// the current user creates the team and repo
			}
		);
	}
}

module.exports = NoRepo_IDTest;
