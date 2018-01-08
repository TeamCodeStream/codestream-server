'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');

class IDsRequiredTest extends CodeStreamAPITest {

	get description () {
		return 'should return error if IDs are not provided to teams query';
	}

	get path () {
		return '/teams';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'ids'
		};
	}
}

module.exports = IDsRequiredTest;
