'use strict';

var CodeStream_API_Test = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');

class IDs_Required_Test extends CodeStream_API_Test {

	get description () {
		return 'should return error if IDs are not provided';
	}

	get path () {
		return '/teams';
	}

	get_expected_error () {
		return {
			code: 'RAPI-1001',
			info: 'ids'
		};
	}
}

module.exports = IDs_Required_Test;
