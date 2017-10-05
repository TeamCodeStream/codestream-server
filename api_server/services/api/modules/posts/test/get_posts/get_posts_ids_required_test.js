'use strict';

var CodeStream_API_Test = require(process.env.CI_API_TOP + '/lib/test_base/codestream_api_test');

const DESCRIPTION = 'should return error if IDs are not provided';

class Get_Posts_IDs_Required_Test extends CodeStream_API_Test {

	get_description () {
		return DESCRIPTION;
	}

	get path () {
		return '/posts';
	}

	get_expected_error () {
		return {
			code: 'RAPI-1001',
			info: 'ids'
		};
	}
}

module.exports = Get_Posts_IDs_Required_Test;
