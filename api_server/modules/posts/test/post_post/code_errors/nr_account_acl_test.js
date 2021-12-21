'use strict';

const NRAccountTest = require('./nr_account_test');
const Assert = require('assert');

class NRAccountAclTest extends NRAccountTest {

	get description () {
		this.dontIncludeCodeErrorAccountId = true;
		return 'should return an unauthorized flag when trying to create and claim a code error but the user does not have access to the account that owns the code error';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011',
			reason: 'user is not authorized to claim this code error for their team',
			info: {
				unauthorized: true,
				unauthorizedAccount: true
			}
		};
	}

	validateResponse (data) {
		Assert.deepStrictEqual(data, { unauthorized: true, unauthorizedAccount: true }, 'response not correct');
	}
}

module.exports = NRAccountAclTest;
