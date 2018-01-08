'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');

class IDsRequiredTest extends CodeStreamAPITest {

	get description () {
		return 'should return error if IDs are not provided to companies query';
	}

	// can't just GET /companies, need to specify IDs or "mine"
	get path () {
		return '/companies';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'ids'
		};
	}
}

module.exports = IDsRequiredTest;
