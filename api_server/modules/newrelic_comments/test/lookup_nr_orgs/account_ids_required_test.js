'use strict';

const LookupNROrgsTest = require('./lookup_nr_orgs_test');

class AccountIdsRequiredTest extends LookupNROrgsTest {

	get description () {
		return 'should return an error when trying to lookup NR orgs with no accountIds provided';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'accountIds'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data.accountIds;
			callback();
		});
	}
}

module.exports = AccountIdsRequiredTest;
