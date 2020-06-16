'use strict';

const ConfirmationTest = require('./confirmation_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class ReuseCodeTest extends ConfirmationTest {

	get description () {
		return 'when registering a second time for the same user, and the user is not yet registered, the confirmation code sent in response to the first registration should be valid for the second';
	}

	// before the test runs...
	before (callback) {
		// register the user twice ... after the first time, collect the confirmation code,
		// then before the confirmation, use the first confirmation code (which should be the same anyway)
		BoundAsync.series(this, [
			super.before,
			this.registerUser,
			this.extractCode,
			this.registerAgain,
			this.setCode
		], callback);
	}

	// extract the confirmation code from the user data returned by the first registration
	extractCode (callback) {
		this.firstConfirmationCode = this.data.confirmationCode;
		callback();
	}

	// register the same user again
	registerAgain (callback) {
		const data = this.getUserData();
		data.email = this.data.email;
		this.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/register',
				data
			},
			callback
		);		
	}

	// set the code used for the confirmation to the confirmation code returned by the first registration
	setCode (callback) {
		this.data.confirmationCode = this.firstConfirmationCode;
		callback();
	}
}

module.exports = ReuseCodeTest;
