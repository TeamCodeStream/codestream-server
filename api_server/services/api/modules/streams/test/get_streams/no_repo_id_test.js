'use strict';

var CodeStream_API_Test = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');

class No_Repo_ID_Test extends CodeStream_API_Test {

	get description () {
		return 'should return error if a no repo ID is provided in the query for file streams';
	}

	get path () {
		return '/streams?type=file&team_id=x';
	}

	get_expected_error () {
		return {
			code: 'RAPI-1006',
			reason: 'queries for file streams require repo_id'
		};
	}
}

module.exports = No_Repo_ID_Test;
