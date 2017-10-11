'use strict';

var CodeStream_API_Test = require(process.env.CI_API_TOP + '/lib/test_base/codestream_api_test');

class Get_Teams_IDs_Required_Test extends CodeStream_API_Test {

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

module.exports = Get_Teams_IDs_Required_Test;
