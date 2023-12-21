'use strict';

const NewUserInCompanyTest = require('./new_user_in_company_test');
const Assert = require('assert');

class ExistingUserInCompanyTest extends NewUserInCompanyTest {

	get description () {
		let desc = 'should find the existing user and set an access token for the user when completing a cross-environment New Relic authorization flow, finding a match to the user\'s New Relic ID';
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
			this.nrUserId = mockUser.nr_userid = this.createCompanyResponse.user.nrUserId;
		}
		return mockUser;
	}

	validateResponse (data) {
		// make sure the user has been added to the existing org
		Assert.strictEqual(this.signupResponse.user.id, this.createCompanyResponse.user.id, 'user not matched');
		Assert.strictEqual(this.signupResponse.user.nrUserId, this.createCompanyResponse.user.nrUserId, 'user not matched by NR user ID');
		return super.validateResponse(data);
	}
}

module.exports = ExistingUserInCompanyTest;
