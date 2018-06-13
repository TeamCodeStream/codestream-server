'use strict';

const CheckResetTest = require('./check_reset_test');
const TokenHandler = require(process.env.CS_API_TOP + '/modules/authenticator/token_handler');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class NoIssuanceTest extends CheckResetTest {

	get description () {
		return 'should return an error when sending a check reset request with a token for a user that was not actually issued a reset token';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1002'
		};
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,
			super.before
		], callback);
	}

	// make a second registered user, we'll use their email for the token
	createOtherUser (callback) {
		this.userFactory.createRandomUser((error, response) => {
			if (error) { return callback(error); }
			this.otherUser = response.user;
			callback();
		});
	}

	// make the query data for the path part of the test request
	makeQueryData () {
		// replace the token with a reset token that has the other user's email in it
		const queryData = super.makeQueryData();
		queryData.token = new TokenHandler(SecretsConfig.auth).generate({ email: this.otherUser.email }, 'rst');
		return queryData;
	}
}

module.exports = NoIssuanceTest;
