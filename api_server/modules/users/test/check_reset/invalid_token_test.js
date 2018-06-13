'use strict';

const CheckResetTest = require('./check_reset_test');

class InvalidTokenTest extends CheckResetTest {

	get description () {
		return 'should return an error when sending a check reset request with a totally invalid token string';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1002'
		};
	}

	// make the query data for the path part of the test request
	makeQueryData () {
		// replace the token with a garbage token
		const queryData = super.makeQueryData();
		queryData.token = 'abcxyz';
		return queryData;
	}
}

module.exports = InvalidTokenTest;
