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

	before (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				let teamId = response.team._id;
				this.path = `/streams?teamId=${teamId}&type=file`;
				callback();
			},
			{
				token: this.token
			}
		);
	}
}

module.exports = NoRepo_IDTest;
