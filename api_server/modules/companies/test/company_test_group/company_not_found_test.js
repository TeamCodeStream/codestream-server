'use strict';

const CompanyTestGroupTest = require('./company_test_group_test');
const ObjectID = require('mongodb').ObjectID;

class CompanyNotFoundTest extends CompanyTestGroupTest {

	get description () {
		return 'should return an error when an attempt to update test groups for a non-existent company is made';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.path = '/company-test-group/' + ObjectID(); // substitute an ID for a non-existent company
			callback();
		});
	}
}

module.exports = CompanyNotFoundTest;
