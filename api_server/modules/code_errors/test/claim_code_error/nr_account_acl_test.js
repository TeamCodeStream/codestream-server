'use strict';

const NRAccountTest = require('./nr_account_test');
const Assert = require('assert');

class NRAccountAclTest extends NRAccountTest {

	get description () {
		this.dontIncludeCodeErrorAccountId = true;
		return 'should return an unauthorized flag when trying to claim a code error but the user does not have access to the account that owns the code error';
	}

	validateResponse (data) {
		Assert.deepStrictEqual(data, { unauthorized: true, unauthorizedAccount: true }, 'response not correct');
	}
}

module.exports = NRAccountAclTest;
