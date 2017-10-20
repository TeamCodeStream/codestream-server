'use strict';

var CodeStream_API_Test = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');

class Invalid_Parameter_Test extends CodeStream_API_Test {

	get description () {
		return 'should return an error if an unknown query parameter is provided';
	}

	get path () {
		return '/posts?thisparam=1';
	}

	get_expected_error () {
		return {
			code: 'RAPI-1006',
			reason: 'invalid query parameter'
		};
	}
}

module.exports = Invalid_Parameter_Test;
