'use strict';

var CodeStream_API_Test = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');

class Invalid_Type_Test extends CodeStream_API_Test {

	get description () {
		return 'should return error if an invalid type is provided in the query';
	}

	get path () {
		return '/streams?type=sometype';
	}

	get_expected_error () {
		return {
			code: 'RAPI-1006',
			reason: 'invalid stream type'
		};
	}
}

module.exports = Invalid_Type_Test;
