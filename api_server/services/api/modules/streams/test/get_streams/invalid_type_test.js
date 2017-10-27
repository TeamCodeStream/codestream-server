'use strict';

var CodeStream_API_Test = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');

class Invalid_Type_Test extends CodeStream_API_Test {

	get description () {
		return 'should return error if an invalid type is provided in the query';
	}

	get_expected_error () {
		return {
			code: 'RAPI-1006',
			reason: 'invalid stream type'
		};
	}

	before (callback) {
		this.repo_factory.create_random_repo(
			(error, response) => {
				if (error) { return callback(error); }
				let team_id = response.team._id;
				this.path = `/streams?team_id=${team_id}&type=sometype`;
				callback();
			},
			{
				token: this.token
			}
		);
	}
}

module.exports = Invalid_Type_Test;
