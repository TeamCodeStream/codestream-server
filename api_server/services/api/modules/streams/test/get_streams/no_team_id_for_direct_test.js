'use strict';

var CodeStream_API_Test = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');

class No_Team_ID_For_Direct_Test extends CodeStream_API_Test {

	get description () {
		return 'should return error if a no team ID is provided in the query for direct streams';
	}

	get path () {
		return '/streams?type=direct&repo_id=x';
	}

	get_expected_error () {
		return {
			code: 'RAPI-1006',
			reason: 'queries for direct streams require team_id'
		};
	}
}

module.exports = No_Team_ID_For_Direct_Test;
