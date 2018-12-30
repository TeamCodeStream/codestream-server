'use strict';

const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const UserTestConstants = require('../user_test_constants');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets.js');
const UserAttributes = require('../../user_attributes');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

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

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.registerUser
		], callback);
	}

	registerUser (callback) {
		const data = this.getUserData();
		Object.assign(data, {
			_confirmationCheat: SecretsConfig.confirmationCheat, // gives us the confirmation code in the response
			_forceConfirmation: true // overrides developer environment, where confirmation might be turned off
		});
		if (this.userOptions.wantLink) {
			data.wantLink = true;
		}
		if (this.userOptions.expiresIn) {
			data.expiresIn = this.userOptions.expiresIn;
		}
		if (this.userOptions.timeout) {
			data.timeout = this.userOptions.timeout;
		}
		this.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/register',
				data: data
			},
			(error, response) => {
				if (error) { return callback(error); }
				const user = response.user;
				this.userId = user.id;
				this.data = { 
					email: user.email
				};
				if (this.userOptions.wantLink) {
					this.data.token = user.confirmationToken;
				}
				else {
					this.data.confirmationCode = user.confirmationCode;
				}
				this.beforeConfirmTime = Date.now();	// to confirm registeredAt set during the request
				callback();
			}
		);
	}

	getUserData () {
		return this.userFactory.getRandomUserData();
	}

	// validate the response to the test request
	validateResponse (data) {
		// validate that we got back the expected user, with an access token and pubnub key
		let user = data.user;
		let errors = [];
		let result = (
			((user.email === this.data.email) || errors.push('incorrect email')) &&
			((user._id === this.userId) || errors.push('incorrect _id')) &&	// DEPRECATE ME
			((user.id === this.userId) || errors.push('incorrect user id')) && 
			((user.isRegistered ) || errors.push('isRegistered not set')) &&
			((typeof user.registeredAt === 'number' && user.registeredAt > this.beforeConfirmTime) || errors.push('registeredAt not properly set'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		Assert(data.accessToken, 'no access token');
		Assert(data.pubnubKey, 'no pubnub key');
		Assert(data.pubnubToken, 'no pubnub token');
		this.validateSanitized(user, UserTestConstants.UNSANITIZED_ATTRIBUTES_FOR_ME);
	}

	// validate that the received user data does not have any attributes a client shouldn't see
	validateSanitized (user, fields) {
		// because me-attributes are usually sanitized out (for other users), but not for the fetching user,
		// we'll need to filter these out before calling the "base" validateSanitized, which would otherwise
		// fail when it sees these attributes
		let meAttributes = Object.keys(UserAttributes).filter(attribute => UserAttributes[attribute].forMe);
		meAttributes.forEach(attribute => {
			let index = fields.indexOf(attribute);
			if (index !== -1) {
				fields.splice(index, 1);
			}
		});
		super.validateSanitized(user, fields);
	}
}

module.exports = ConfirmationTest;
