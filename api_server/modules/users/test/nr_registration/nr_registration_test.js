'use strict';

const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const UserTestConstants = require('../user_test_constants');

class NRRegistrationTest extends CodeStreamAPITest {

	get description () {
		return 'should return valid user data when registering';
	}

	get method () {
		return 'post';
	}

	get path () {
		return '/no-auth/nr-register';
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.expectedUserData = this.userFactory.randomNamedUser();
			const userId = Math.floor(Math.random() * 1000000000);
			this.expectedUserData.providerInfo = {
				newrelic: {
					accessToken: 'dummy',
					data: {
						userId: userId,
						apiUrl: 'https://api.newrelic.com'
					},
					isApiToken: true
				}
			};
			this.data = {
				apiKey: 'dummy'
			};
			this.apiRequestOptions = {
				headers: {
					// TODO: use more appropriate secret
					'X-CS-NewRelic-Secret': this.apiConfig.sharedSecrets.commentEngine,
					'X-CS-Mock-Email': this.expectedUserData.email,
					'X-CS-Mock-Id': userId,
					'X-CS-Mock-Name': this.expectedUserData.fullName
				}
			};
			this.ignoreTokenOnRequest = true;
			this.expectedVersion = 1;
			callback();
		});
	}

	/* eslint complexity: 0 */
	validateResponse (data) {
		let user = data.user;
		let errors = [];
		(user.secondaryEmails || []).sort();
		(this.data.secondaryEmails || []).sort();
		const email = this.expectedUserData.email.trim();
		const username = email.split('@')[0].replace(/\+/g, '');
		let result = (
			((user.id === user._id) || errors.push('id not set to _id')) && 	// DEPRECATE ME
			((user.email === email) || errors.push('incorrect email')) &&
			((JSON.stringify(user.secondaryEmails) === JSON.stringify(this.data.secondaryEmails)) || errors.push('secondaryEmails does not natch')) &&
			((user.username === username) || errors.push('incorrect username')) &&
			((user.fullName === this.expectedUserData.fullName) || errors.push('incorrect full name')) &&
			((user.timeZone === this.data.timeZone) || errors.push('incorrect time zone')) &&
			((user.deactivated === false) || errors.push('deactivated not false')) &&
			((typeof user.createdAt === 'number') || errors.push('createdAt not number')) &&
			((user.modifiedAt >= user.createdAt) || errors.push('modifiedAt not greater than or equal to createdAt')) &&
			((user.creatorId === (this.expectedCreatorId || user.id).toString()) || errors.push('creatorId not equal to id')) &&
			((user.version === this.expectedVersion) || errors.push('version is not correct'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		Assert.deepEqual(user.providerInfo, this.expectedUserData.providerInfo, 'providerInfo is not correct');
		Assert.deepEqual(user.providerIdentities, [], 'providerIdentities is not an empty array');
		// verify we got no attributes that clients shouldn't see
		this.validateSanitized(user, UserTestConstants.UNSANITIZED_ATTRIBUTES_FOR_ME);
	}
}

module.exports = NRRegistrationTest;
