'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');

class PathRequiredTest extends CodeStreamAPITest {

	get description () {
		return 'should return error if path is not provided with repoId';
	}

	before (callback) {
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
