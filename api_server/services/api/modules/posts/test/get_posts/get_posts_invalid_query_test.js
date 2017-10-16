'use strict';

var CodeStream_API_Test = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');

class Get_Posts_Invalid_Query_Test extends CodeStream_API_Test {

	get description () {
		return 'should return an error when an invalid query parameter is sent';
	}

	get path () {
		return '/posts?foobar=1';
	}

	get_expected_error () {
		return {
			code: 'RAPI-1007',
			reason: 'invalid query parameter: foobar'
		};
	}
}

module.exports = Get_Posts_Invalid_Query_Test;
