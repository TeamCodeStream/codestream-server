// handle unit tests for the "DELETE /companies/:id" request, to deactivate a company

'use strict';

const DeleteCompanyTest = require('./delete_company_test');
const DeleteCompanyFetchTest = require('./delete_company_fetch_test');
const MessageTest = require('./message_test');
const ACLTest = require('./acl_test');

class DeleteCompanyRequestTester {

	test () {
		new DeleteCompanyTest().test();
		new DeleteCompanyFetchTest().test();
		new MessageTest().test();
		new ACLTest().test();
	}
}

module.exports = new DeleteCompanyRequestTester();