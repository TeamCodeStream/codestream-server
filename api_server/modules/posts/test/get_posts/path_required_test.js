'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');

class PathRequiredTest extends CodeStreamAPITest {

	get description () {
		return 'should return error if path is not provided with repoId';
	}

	// before the test runs...
	before (callback) {
		// create a random repo and try to do GET /posts for that repo, but without
		// specifying a path the request should be rejected
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.path = `/posts?teamId=${response.team._id}&repoId=${response.repo._id}`;
				callback();
			},
			{
				token: this.token
			}
		);
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'path'
		};
	}
}

module.exports = PathRequiredTest;
