'use strict';

const ChangeEmailConfirmTest = require('./change_email_confirm_test');
const TokenHandler = require(process.env.CS_API_TOP + '/modules/authenticator/token_handler');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class NoIssuanceTest extends ChangeEmailConfirmTest {

	get description () {
		return 'should return an error when sending a confirm change of email request with a token for a user that was not actually issued an email token';
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

	// set the data to use when submitting the request
	setData (callback) {
		// replace the token with an email token that has the other user's ID in it
		super.setData(() => {
			const tokenHandler = new TokenHandler(SecretsConfig.auth);
			const payload = tokenHandler.decode(this.data.token);
			payload.uid = this.otherUser._id;
			this.data.token = tokenHandler.generate(payload, 'email');
			callback();
		});
	}
}

module.exports = NoIssuanceTest;
