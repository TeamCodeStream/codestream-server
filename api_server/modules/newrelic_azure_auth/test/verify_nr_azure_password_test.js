'use strict';

const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT +
	'/api_server/lib/test_base/codestream_api_test');

class LoginTest extends CodeStreamAPITest {
	constructor(options) {
		super(options);
		this.userOptions.numRegistered = 1;
		this.teamOptions.numAdditionalInvites = 0;
	}

	get description() {
		return 'should return correct response when validating a user password against Azure for New Relic';
	}

	get method() {
		return 'post';
	}

	get path() {
		return '/no-auth/verify-nr-azure-user';
	}

	// before the test runs...
	before(callback) {
		super.before((error) => {
			if (error) {
				return callback(error);
			}
			this.data = {
				email: this.currentUser.user.email,
				password: this.currentUser.password,
			};
			callback();
		});
	}

	// validate the response to the test request
	validateResponse(data) {
		console.warn('RESPONSE:', data);
		const expectedResponse = {
			tokenSuccess: true,
			migrationRequired: false,
		};
		Assert.deepStrictEqual(data, expectedResponse, 'response is incorrect');
	}
}

module.exports = LoginTest;
