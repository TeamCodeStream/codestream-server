'use strict';

const DeleteCompanyTest = require('./delete_company_test');
const ObjectId = require('mongodb').ObjectId;

class CompanyNotFoundTest extends DeleteCompanyTest {

	get description () {
		return 'should return an error when trying to delete a company that doesn\'t exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'company'
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.path = '/companies/' + ObjectId(); // substitute a non-existent company ID
			callback();
		});
	}
}

module.exports = CompanyNotFoundTest;