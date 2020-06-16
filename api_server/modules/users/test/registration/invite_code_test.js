'use strict';

const RegistrationTest = require('./registration_test');
const Assert = require('assert');
const UserTestConstants = require('../user_test_constants');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class InviteCodeTest extends RegistrationTest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 2;
		this.teamOptions.creatorIndex = 1;
	}

	get description () {
		return 'should return the user and login info when registering a user with an invite code, where the email is the same for which the invite code was generated';
	}

	getExpectedFields () {
		const expectedResponse = { ...UserTestConstants.EXPECTED_LOGIN_RESPONSE };
		if (this.usingSocketCluster) {
			delete expectedResponse.pubnubKey;
			delete expectedResponse.pubnubToken;
		}
		return expectedResponse;
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.inviteUser
		], callback);
	}

	// invite the user before registering ... since the user is registering with the same email
	// with which they were invited, and since they provide an invite code, we should skip confirmation
	// and just log them in
	inviteUser (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/users',
				data: {
					teamId: this.team.id,
					email: this.data.email,
					_pubnubUuid: this.data._pubnubUuid,
					_confirmationCheat: this.apiConfig.secrets.confirmationCheat,
					_inviteCodeExpiresIn: this.inviteCodeExpiresIn
				},
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.data.inviteCode = response.inviteCode;
				callback();
			}
		);
	}

	// validate the response to the test request
	validateResponse (data) {
		// validate we get back the expected user, an access token, and a pubnub subscription key
		Assert(data.user._id === data.user.id, 'id not set to _id');	// DEPRECATE ME
		Assert(data.user.email === this.data.email, 'email doesn\'t match');
		Assert(data.accessToken, 'no access token');
		Assert(this.usingSocketCluster || data.pubnubKey, 'no pubnub key');
		Assert(this.usingSocketCluster || data.pubnubToken, 'no pubnub token');
		Assert(data.broadcasterToken, 'no broadcaster token');
		const expectedCapabilities = { ...UserTestConstants.API_CAPABILITIES };
		if (this.apiConfig.email.suppressEmails) {
			delete expectedCapabilities.emailSupport;
		}
		Assert.deepEqual(data.capabilities, expectedCapabilities, 'capabilities are incorrect');

		this.validateSanitized(data.user, UserTestConstants.UNSANITIZED_ATTRIBUTES_FOR_ME);
	}
}

module.exports = InviteCodeTest;
