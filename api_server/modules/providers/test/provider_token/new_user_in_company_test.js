'use strict';

const NRLoginTest = require('./nrlogin_test');
const Assert = require('assert');

class NewUserInCompanyTest extends NRLoginTest {

	constructor (options) {
		super(options);
		this.wantExistingCompany = true;
	}

	get description () {
		let desc = 'should create a user and set an access token for the user when completing a New Relic authorization flow, finding a match to the user\'s org';
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
			mockUser.nr_orgid = this.createCompanyResponse.companies[0].linkedNROrgId;
		}
		return mockUser;
	}

	validateResponse (data) {
		// make sure the user has been added to the existing org
		Assert.strictEqual(this.signupResponse.companies[0].linkedNROrgId, this.createCompanyResponse.companies[0].linkedNROrgId, 'created user org does not match the org of the originally created company');
		Assert.strictEqual(this.signupResponse.user.companyIds[0], this.createCompanyResponse.companies[0].id, 'user not added to the originally created company');
		return super.validateResponse(data);
	}
}

module.exports = NewUserInCompanyTest;
