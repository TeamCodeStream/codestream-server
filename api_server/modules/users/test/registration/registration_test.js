'use strict';

const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const UserTestConstants = require('../user_test_constants');

class RegistrationTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 0;
		delete this.teamOptions.creatorIndex;
	}
	
	get description () {
		const oneUserPerOrg = this.oneUserPerOrg ? ', under one-user-per-org paradigm' : ''; // ONE_USER_PER_ORG
		return `should return valid user data when registering${oneUserPerOrg}`;
	}

	get method () {
		return 'post';
	}

	get path () {
		return '/no-auth/register';
	}

	getExpectedFields () {
		return UserTestConstants.EXPECTED_REGISTRATION_RESPONSE;
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			// establish random user data for the registration, we cheat and fetch the
			// confirmation code in the test so we don't have to get it from an email
			this.data = this.userFactory.getRandomUserData();
			this.data._confirmationCheat = this.apiConfig.sharedSecrets.confirmationCheat;
			this.expectedVersion = 1;
			callback();
		});
	}

	/* eslint complexity: 0 */
	// validate the response to the test request
	validateResponse (data) {
		// verify we got a valid user object back, with the attributes epected
		let user = data.user;
		let errors = [];
		const email = this.data.email.trim();
		let result = (
			((user.id === user._id) || errors.push('id not set to _id')) && 	// DEPRECATE ME
			((user.email === email) || errors.push('incorrect email')) &&
			((user.username === this.data.username) || errors.push('incorrect username')) &&
			((user.fullName === this.data.fullName) || errors.push('incorrect full name')) &&
			((user.timeZone === this.data.timeZone) || errors.push('incorrect time zone')) &&
			((user.deactivated === false) || errors.push('deactivated not false')) &&
			((typeof user.createdAt === 'number') || errors.push('createdAt not number')) &&
			((user.modifiedAt >= user.createdAt) || errors.push('modifiedAt not greater than or equal to createdAt')) &&
			((user.creatorId === (this.expectedCreatorId || user.id).toString()) || errors.push('creatorId not equal to id')) &&
			((typeof user.confirmationCode === 'string') || errors.push('confirmationCode is not a string')) &&
			((user.phoneNumber === '') || errors.push('phoneNumber not set to default of empty string')) &&
			((user.iWorkOn === '') || errors.push('iWorkOn not set to default value of empty string')) &&
			((user.version === this.expectedVersion) || errors.push('version is not correct'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		Assert.deepEqual(user.providerIdentities, [], 'providerIdentities is not an empty array');
		this.confirmationCode = user.confirmationCode;
		delete user.confirmationCode; // this is technically unsanitized, but we "cheat" during the test
		if (this.oneUserPerOrg) {
			Assert.strictEqual(user.originUserId, user.id, 'originUserId not set to user.id');
			Assert(user.copiedFromUserId === undefined, 'copiedFromUserId should not be defined');
		}
		// verify we got no attributes that clients shouldn't see
		this.validateSanitized(user, UserTestConstants.UNSANITIZED_ATTRIBUTES_FOR_ME);
	}
}

module.exports = RegistrationTest;
