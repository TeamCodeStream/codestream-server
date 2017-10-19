'use strict';

var CodeStream_API_Test = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');

class No_Team_ID_For_Channels_Test extends CodeStream_API_Test {

	get description () {
		return 'should return error if a no team ID is provided in the query for channel streams';
	}

	get path () {
		return '/streams?type=channel&repo_id=x';
	}

	get_expected_error () {
		return {
			code: 'RAPI-1006',
			reason: 'queries for channel streams require team_id'
		};
	}
}

module.exports = No_Team_ID_For_Channels_Test;
