'use strict';

const CheckResetTest = require('./check_reset_test');

class CheckResetDeprecatedTest extends CheckResetTest {

	get description () {
		return 'should return an error in response to a check-reset request, endpoint is deprecated';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1016'
		};
	}
}

module.exports = CheckResetDeprecatedTest;
