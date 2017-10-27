'use strict';

var CodeStream_API_Test = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');

class No_Repo_ID_Test extends CodeStream_API_Test {

	get description () {
		return 'should return error if a no repo ID is provided in the query for file streams';
	}

	get_expected_error () {
		return {
			code: 'RAPI-1006',
			reason: 'queries for file streams require repo_id'
		};
	}

	before (callback) {
		this.repo_factory.create_random_repo(
			(error, response) => {
				if (error) { return callback(error); }
				let team_id = response.team._id;
				this.path = `/streams?team_id=${team_id}&type=file`;
				callback();
			},
			{
				token: this.token
			}
		);
	}
}

module.exports = No_Repo_ID_Test;
