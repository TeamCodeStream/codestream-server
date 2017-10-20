'use strict';

var CodeStream_API_Test = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');

class Invalid_ID_Test extends CodeStream_API_Test {

	get description () {
		return 'should return an error if an invalid id is provided with a relational query parameter';
	}

	get path () {
		return `/posts?lt=1`;
	}

	get_expected_error () {
		return {
			code: 'RAPI-1006',
			reason: 'invalid id'
		};
	}
}

module.exports = Invalid_ID_Test;
