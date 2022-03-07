'use strict';

const UserCompaniesTest = require('./user_companies_test');

class NoSecretTest extends UserCompaniesTest {

	get description () {
		return 'should return an error when making a cross-environment request to fetch companies but not providing the auth secret';
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
