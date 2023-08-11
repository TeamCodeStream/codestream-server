'use strict';

const PostCompanyTest = require('./post_company_test');
const Assert = require('assert');

class CompanyNameFromRegistrationTest extends PostCompanyTest {

	constructor (options) {
		super(options);
		this.expectFullResponse = true;
	}

	get description () {
		return 'a company name submitted at user registration should carry through to when that same user creates their first company';
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.duplicateCompanyCreator(callback);
		});
	}

	duplicateCompanyCreator (callback) {
		// the org-creation flow with Phase 2 of Unified Idenity is to register and confirm
		// a new user (here we test a user with the same email, but it doesn't have to be),
		// and then have them create a new company
		this.expectedName = this.companyFactory.randomName();
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.token = response.accessToken;
				this.currentUser = response;
				callback();
			},
			{
				useEmail: this.currentUser.user.email,
				companyName: this.expectedName,
				confirmationCheat: this.apiConfig.sharedSecrets.confirmationCheat
			}
		);
	}
}

module.exports = CompanyNameFromRegistrationTest;
