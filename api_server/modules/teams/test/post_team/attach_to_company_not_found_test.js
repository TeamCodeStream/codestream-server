'use strict';

const AttachToCompanyTest = require('./attach_to_company_test');
const ObjectId = require('mongodb').ObjectId;

class AttachToCompanyNotFoundTest extends AttachToCompanyTest {

	get description () {
		return 'when creating a team attached to an existing company, should get an error if the company is not found';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'company'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.companyId = ObjectId();
			callback();
		});
	}
}

module.exports = AttachToCompanyNotFoundTest;
