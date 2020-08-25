'use strict';

const CheckResetTest = require('./check_reset_test');
const TokenHandler = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/token_handler');

class UserNotFoundTest extends CheckResetTest {

	get description () {
		return 'should return an error when sending a check reset request with a token that has an unknown email';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1002'
		};
	}

	// make the query data for the path part of the test request
	makeQueryData () {
		// replace the token with a reset token for a non-existent user
		const queryData = super.makeQueryData();
		const email = this.userFactory.randomEmail();
		queryData.token = new TokenHandler(this.apiConfig.sharedSecrets.auth).generate({ email }, 'rst');
		return queryData;
	}
}

module.exports = UserNotFoundTest;
