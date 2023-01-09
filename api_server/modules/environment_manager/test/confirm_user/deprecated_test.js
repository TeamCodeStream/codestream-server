'use strict';

const ConfirmUserTest = require('./confirm_user_test');

class DeprecatedInOneUserPerOrgTest extends ConfirmUserTest {

	get description () {
		return 'should return an error indicating request is deprecated when making a request to confirm a user account across environments when we are in ONE_USER_PER_ORG mode';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1016'
		};
	}
}

module.exports = DeprecatedInOneUserPerOrgTest;
