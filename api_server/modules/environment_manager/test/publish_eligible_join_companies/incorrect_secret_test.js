'use strict';

const PublishEligibleJoinCompaniesTest = require('./publish_eligible_join_companies_test');

class IncorrectSecretTest extends PublishEligibleJoinCompaniesTest {

	get description () {
		return 'should return an error when making a cross-environment request to publish eligible join companies but not providing the correct auth secret';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1001'
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.apiRequestOptions.headers['X-CS-Auth-Secret'] = 'xxxxxxxxxxx';
			callback();
		});
	}
}

module.exports = IncorrectSecretTest;
