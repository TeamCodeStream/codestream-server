'use strict';

// we can remove this test when we fully move to ONE_USER_PER_ORG, as that will be the default

const ForgotPasswordTest = require('./forgot_password_test');

class OneUserPerOrgOkTest extends ForgotPasswordTest {

	constructor (options) {
		super(options);
		this.oneUserPerOrg = true;
	}

	get description () {
		return super.description + ', under one-user-per-org';
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			// have the user create a second company, just to test the scenario where
			// there are multiple user records under one-user-per-org
			this.companyFactory.createRandomCompany(callback, { token: this.token });
		});
	}
}

module.exports = OneUserPerOrgOkTest;
