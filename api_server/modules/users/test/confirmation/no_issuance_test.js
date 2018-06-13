'use strict';

const ConfirmationWithLinkTest = require('./confirmation_with_link_test');
const TokenHandler = require(process.env.CS_API_TOP + '/modules/authenticator/token_handler');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class NoIssuanceTest extends ConfirmationWithLinkTest {

	get description () {
		return 'should return an error when confirming with a token for a user that was not actually issued a confirmation token';
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
			super.before,
			this.changeToken
		], callback);
	}

	// make a second registered user, we'll use their user ID for the token
	createOtherUser (callback) {
		this.userFactory.createRandomUser((error, response) => {
			if (error) { return callback(error); }
			this.otherUser = response.user;
			callback();
		});
	}

	// change the token to reference the other user
	changeToken (callback) {
		const tokenHandler = new TokenHandler(SecretsConfig.auth);
		const payload = tokenHandler.decode(this.data.token);
		payload.uid = this.otherUser._id;
		this.data.token = tokenHandler.generate(payload, 'conf');
		callback();
	}
}

module.exports = NoIssuanceTest;
