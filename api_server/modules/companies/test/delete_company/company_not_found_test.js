'use strict';

const DeleteCompanyTest = require('./delete_company_test');
const ObjectID = require('mongodb').ObjectID;

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
			this.path = '/companies/' + ObjectID(); // substitute a non-existent company ID
			callback();
		});
	}
}

module.exports = CompanyNotFoundTest;