'use strict';

const ConfirmationTest = require('./confirmation_test');
const Assert = require('assert');

class ForceCreateCompanyTest extends ConfirmationTest {

	get description () {
		return 'when a user begins registration and specifies a company name, the response to confirmation should have the forceCreateCompany flag set';
	}

	getUserData () {
		const data = super.getUserData();
		data.companyName = this.companyFactory.randomName();
		return data;
	}
			
	// validate the response to the test request
	validateResponse (data) {
		Assert(data.forceCreateCompany, 'forceCreateCompany not set');
		super.validateResponse(data);
	}
}

module.exports = ForceCreateCompanyTest;
