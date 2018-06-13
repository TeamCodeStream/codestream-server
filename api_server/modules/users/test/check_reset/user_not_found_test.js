'use strict';

const CheckResetTest = require('./check_reset_test');
const TokenHandler = require(process.env.CS_API_TOP + '/modules/authenticator/token_handler');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets');

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
		queryData.token = new TokenHandler(SecretsConfig.auth).generate({ email }, 'rst');
		return queryData;
	}
}

module.exports = UserNotFoundTest;
