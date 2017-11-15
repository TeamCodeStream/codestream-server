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

	before (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				let teamId = response.team._id;
				this.path = `/streams?teamId=${teamId}&type=sometype`;
				callback();
			},
			{
				token: this.token
			}
		);
	}
}

module.exports = InvalidTypeTest;
