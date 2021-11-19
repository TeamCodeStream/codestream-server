// handle unit tests for the "POST /lookup-nr-orgs" request,
// to lookup New Relic orgs by account ID

'use strict';

const LookupNROrgsTest = require('./lookup_nr_orgs_test');
const AccountIdsRequiredTest = require('./account_ids_required_test');
const EmptyResultTest = require('./empty_result_test');

class LookupNROrgsRequestTester {

	test () {
		new LookupNROrgsTest().test();
		new AccountIdsRequiredTest().test();
		new EmptyResultTest().test();
	}
}

module.exports = new LookupNROrgsRequestTester();
