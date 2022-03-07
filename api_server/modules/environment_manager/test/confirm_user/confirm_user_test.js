'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const UserTestConstants = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/test/user_test_constants');
const Assert = require('assert');

class ConfirmUserTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		delete this.teamOptions.creatorIndex;
		this.userOptions.numRegistered = 0;
		this.userOptions.numUnregistered = 1;
	}

	get description () {
		return 'should confirm a user across environments when requested';
	}

	get method () {
		return 'post';
	}

	get path () {
		return '/xenv/confirm-user';
	}

	getExpectedFields () {
		return { user: UserTestConstants.EXPECTED_USER_FIELDS };
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.beforeConfirmTime = Date.now();	// to confirm registeredAt set during the request
			this.data = {
				email: this.users[0].user.email
			};
			this.apiRequestOptions = {
				headers: {
					'X-CS-Auth-Secret': this.apiConfig.sharedSecrets.auth
				}
			};
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		// validate that we got back the expected user, with an access token and pubnub key
		let user = data.user;
		const expectedUser = this.users[0].user;
		let errors = [];
		let result = (
			((user.email === this.data.email) || errors.push('incorrect email')) &&
			((user._id === expectedUser.id) || errors.push('incorrect _id')) &&	// DEPRECATE ME
			((user.id === expectedUser.id) || errors.push('incorrect user id')) && 
			((user.isRegistered) || errors.push('isRegistered not set')) &&
			((user.preferences && user.preferences.acceptedTOS) || errors.push('acceptedTOS not set in preferences')) &&
			((typeof user.registeredAt === 'number' && user.registeredAt > this.beforeConfirmTime) || errors.push('registeredAt not properly set')) &&
			((user.firstSessionStartedAt === undefined) || errors.push('firstSesssionStartedAt should not have been set'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		Assert(data.accessToken, 'no access token in response');
		this.validateSanitized(user, UserTestConstants.UNSANITIZED_ATTRIBUTES_FOR_ME);
	}
}

module.exports = ConfirmUserTest;
