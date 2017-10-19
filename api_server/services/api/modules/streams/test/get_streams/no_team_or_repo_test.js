'use strict';

var CodeStream_API_Test = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');

class No_Team_Or_Repo_Test extends CodeStream_API_Test {

	get description () {
		return 'should return error if a no team or repo ID is provided in the query';
	}

	get path () {
		return '/streams?type=channel';
	}

	get_expected_error () {
		return {
			code: 'RAPI-1006',
			reason: 'team_id or repo_id required'
		};
	}
}

module.exports = No_Team_Or_Repo_Test;
