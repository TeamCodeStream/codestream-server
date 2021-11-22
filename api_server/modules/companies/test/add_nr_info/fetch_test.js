'use strict';

const AddNRInfoTest = require('./add_nr_info_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class FetchTest extends AddNRInfoTest {

	get description () {
		return 'should set New Relic account/org info for a company when requested, checked by fetching the company';
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

module.exports = FetchTest;
