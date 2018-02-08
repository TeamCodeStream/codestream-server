'use strict';

var Assert = require('assert');
var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const UserTestConstants = require('../user_test_constants');

class ConfirmationTest extends CodeStreamAPITest {

	get description () {
		return 'should return valid user data and an access token when confirming a registration';
	}

	get method () {
		return 'post';
	}

	get path () {
		return '/no-auth/confirm';
	}

	getExpectedFields () {
		return UserTestConstants.EXPECTED_LOGIN_RESPONSE;
	}

	dontWantToken () {
		return true;
	}

	before (callback) {
		this.userFactory.registerRandomUser((error, data) => {
			if (error) { return callback(error); }
			this.data = {
				userId: data.user._id,
				email: data.user.email,
				confirmationCode: data.user.confirmationCode
			};
			callback();
		}, this.userOptions || {});
	}

	validateResponse (data) {
		let user = data.user;
		let errors = [];
		let result = (
			((user.email === this.data.email) || errors.push('incorrect email')) &&
			((user._id === this.data.userId) || errors.push('incorrect user id'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		Assert(data.accessToken, 'no access token');
		Assert(data.pubnubKey, 'no pubnub key');
		this.validateSanitized(user, UserTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = ConfirmationTest;
