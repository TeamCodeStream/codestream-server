'use strict';

const PutCompanyTest = require('./put_company_test');
const ObjectId = require('mongodb').ObjectId;

class CompanyNotFoundTest extends PutCompanyTest {

	get description () {
		return 'should return an error when trying to update a company that doesn\'t exist';
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
			this.path = '/companies/' + ObjectId(); // substitute an ID for a non-existent company
			callback();
		});
	}
}

module.exports = CompanyNotFoundTest;
