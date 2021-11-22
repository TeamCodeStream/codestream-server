'use strict';

const AddNRInfoTest = require('./add_nr_info_test');

class OnlyAccountIdsTest extends AddNRInfoTest {

	get description () {
		return 'should be ok to update New Relic org/account info for a company when only account IDs are specified';
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data.orgIds;
			delete this.expectedData.company.$addToSet.nrOrgIds;
			callback();
		});
	}
}

module.exports = OnlyAccountIdsTest;
