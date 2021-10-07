'use strict';

const JoinCompanyTest = require('./join_company_test');
const ObjectID = require('mongodb').ObjectID;

class CompanyNotFoundTest extends JoinCompanyTest {

	get description () {
		return 'should return an error when trying to join a company that doesn\'t exist';
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
			this.path = '/companies/join/' + ObjectID(); // substitute an ID for a non-existent company
			callback();
		});
	}
}

module.exports = CompanyNotFoundTest;
