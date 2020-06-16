'use strict';

const CheckResetTest = require('./check_reset_test');
const TokenHandler = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/token_handler');

class NotRstTokenTest extends CheckResetTest {

	get description () {
		return 'should return an error when sending a check reset request with a token that is not an rst token';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1002'
		};
	}

	// make the query data for the path part of the test request
	makeQueryData () {
		// replace the token with a non-reset token
		const queryData = super.makeQueryData();
		queryData.token = new TokenHandler(this.apiConfig.secrets.auth).generate({email: this.currentUser.email}, 'xyz');
		return queryData;
	}
}

module.exports = NotRstTokenTest;
