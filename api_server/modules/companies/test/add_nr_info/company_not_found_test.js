'use strict';

const AddNRInfoTest = require('./add_nr_info_test');
const ObjectId = require('mongodb').ObjectId;

class CompanyNotFoundTest extends AddNRInfoTest {

	get description () {
		return 'should return an error when an attempt to update New Relic org/account data for a non-existent company is made';
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
			this.path = '/companies/add-nr-info/' + ObjectId(); // substitute an ID for a non-existent company
			callback();
		});
	}
}

module.exports = CompanyNotFoundTest;
