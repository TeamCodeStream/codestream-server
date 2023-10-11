'use strict';

const NewUserInCompanyTest = require('./new_user_in_company_test');
const Assert = require('assert');

class ExistingUserInCompanyByEmailTest extends NewUserInCompanyTest {

	get description () {
		let desc = 'should find the existing user and set an access token for the user when completing a New Relic authorization flow, finding a match to the user\'s email but not New Relic user ID';
		if (this.serviceGatewayEnabled) {
			desc += ', and set CodeStream access token with Service Gateway auth enabled';
		}
		return desc;
	}

	// get a mock user to use in the request
	getMockUser () {
		// match the org of the mock user to the org of the company already created
		const mockUser = super.getMockUser();
		if (this.createCompanyResponse) {
			this.nrUserId = mockUser.nr_userid = this.getMockNRUserId();
			mockUser.email = this.createCompanyResponse.user.email;
		}
		return mockUser;
	}

	validateResponse (data) {
		// make sure the user has been added to the existing org
		Assert.strictEqual(this.signupResponse.user.id, this.createCompanyResponse.user.id, 'user not matched');
		return super.validateResponse(data);
	}
}

module.exports = ExistingUserInCompanyByEmailTest;
