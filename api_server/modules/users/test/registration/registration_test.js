'use strict';

var Assert = require('assert');
var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const UserTestConstants = require('../user_test_constants');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets.js');
const ApiConfig = require(process.env.CS_API_TOP + '/config/api.js');

class RegistrationTest extends CodeStreamAPITest {

	get description () {
		return 'should return valid user data when registering';
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

	dontWantToken () {
		return true;
	}

	before (callback) {
		this.data = this.userFactory.getRandomUserData();
		this.data._confirmationCheat = SecretsConfig.confirmationCheat;
		this.data.betaCode = ApiConfig.testBetaCode;	// overrides needing a true beta code
		callback();
	}

	validateResponse (data) {
		let user = data.user;
		let errors = [];
		(user.secondaryEmails || []).sort();
		(this.data.secondaryEmails || []).sort();
		let result = (
			((user.email === this.data.email) || errors.push('incorrect email')) &&
			((JSON.stringify(user.secondaryEmails) === JSON.stringify(this.data.secondaryEmails)) || errors.push('secondaryEmails does not natch')) &&
			((user.username === this.data.username) || errors.push('incorrect username')) &&
			((user.firstName === this.data.firstName) || errors.push('incorrect first name')) &&
			((user.lastName === this.data.lastName) || errors.push('incorrect last name')) &&
			((user.deactivated === false) || errors.push('deactivated not false')) &&
			((typeof user.createdAt === 'number') || errors.push('createdAt not number')) &&
			((user.modifiedAt >= user.createdAt) || errors.push('modifiedAt not greater than or equal to createdAt')) &&
			((user.creatorId === user._id.toString()) || errors.push('creatorId not equal to _id')) &&
			((typeof user.confirmationCode === 'string') || errors.push('confirmationCode is not a string'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		delete user.confirmationCode; // this is technically unsanitized, but we "cheat" during the test
		this.validateSanitized(user, UserTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = RegistrationTest;
