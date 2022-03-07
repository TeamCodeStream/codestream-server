'use strict';

const EligibleJoinCompaniesTest = require('./eligible_join_companies_test');

class NoSecretTest extends EligibleJoinCompaniesTest {

	get description () {
		return 'should return an error when making a cross-environment request to fetch eligible join companies but not providing the auth secret';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1001'
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			delete this.apiRequestOptions.headers['X-CS-Auth-Secret'];
			callback();
		});
	}
}

module.exports = NoSecretTest;
