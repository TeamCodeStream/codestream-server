// handle unit tests for the "POST /companies/add-nr-info/:id" request, 
// to add New Relic account info for a company

'use strict';

const DeprecatedTest = require('./deprecated_test');
/*
const AddNRInfoTest = require('./add_nr_info_test');
const FetchTest = require('./fetch_test');
const MessageTest = require('./message_test');
const CompanyNotFoundTest = require('./company_not_found_test');
const ACLTest = require('./acl_test');
const OnlyAccountIdsTest = require('./only_account_ids_test');
const OnlyOrgIdsTest = require('./only_org_ids_test');
const AddToExistingTest = require('./add_to_existing_test');
const AddToExistingFetchTest = require('./add_to_existing_fetch_test');
*/

class CompanyTestGroupRequestTester {

	test () {
		new DeprecatedTest().test();
		/*
		new AddNRInfoTest().test();
		new FetchTest().test();
		new MessageTest().test();
		new CompanyNotFoundTest().test();
		new ACLTest().test();
		new OnlyAccountIdsTest().test();
		new OnlyOrgIdsTest().test();
		new AddToExistingTest().test();
		new AddToExistingFetchTest().test();
		*/
	}
}

module.exports = new CompanyTestGroupRequestTester();
