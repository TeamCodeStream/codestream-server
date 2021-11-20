'use strict';

const AddToExistingTest = require('./add_to_existing_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class AddToExistingFetchTest extends AddToExistingTest {

	get description () {
		return 'should be ok to update New Relic org/account info for a company which already has org/account info, checked by fetching the company';
	}

	// run the actual test...
	run (callback) {
		// we'll run the update, but also verify the update took by fetching and validating
		// the company object
		BoundAsync.series(this, [
			super.run,
			this.validateCompanyObject
		], callback);
	}
}

module.exports = AddToExistingFetchTest;
