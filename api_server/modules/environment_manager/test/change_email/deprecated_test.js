'use strict';

const ChangeEmailTest = require('./change_email_test');

class DeprecatedInOneUserPerOrgTest extends ChangeEmailTest {

	get description () {
		return 'should return an error indicating request is deprecated when making a request to change a user\'s email across environments when we are in ONE_USER_PER_ORG mode';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1016'
		};
	}
}

module.exports = DeprecatedInOneUserPerOrgTest;
