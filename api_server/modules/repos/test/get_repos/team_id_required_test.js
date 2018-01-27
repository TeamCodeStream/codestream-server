'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');

class TeamIDRequiredTest extends CodeStreamAPITest {

	get description () {
		return 'should return error if teamId is not provided to repos query';
	}

	get path () {
		return '/repos';	// no teamId
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'teamId'
		};
	}
}

module.exports = TeamIDRequiredTest;
