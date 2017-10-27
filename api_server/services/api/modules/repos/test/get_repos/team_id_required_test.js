'use strict';

var CodeStream_API_Test = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');

class Team_ID_Required_Test extends CodeStream_API_Test {

	get description () {
		return 'should return error if team_id is not provided';
	}

	get path () {
		return '/repos';
	}

	get_expected_error () {
		return {
			code: 'RAPI-1001',
			info: 'team_id'
		};
	}
}

module.exports = Team_ID_Required_Test;
