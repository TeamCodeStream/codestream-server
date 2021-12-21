// handle unit tests for the "DELETE /companies/:id" request, to deactivate a company

'use strict';

const DeleteCompanyTest = require('./delete_company_test');
const DeleteCompanyFetchTest = require('./delete_company_fetch_test');
const MessageTest = require('./message_test');
const ACLTest = require('./acl_test');
const AlreadyDeletedTest = require('./already_deleted_test');
const TeamDeletedTest = require('./team_deleted_test');
const CompanyNotFoundTest = require('./company_not_found_test');
const UserDeletedTest = require('./user_deleted_test');

class DeleteCompanyRequestTester {

	test () {
		new DeleteCompanyTest().test();
		new ACLTest().test();
		new TeamDeletedTest().test();
		new UserDeletedTest().test();
		new CompanyNotFoundTest().test();

		// fails with 403, not authorized to read
		// new DeleteCompanyFetchTest().test();

		// fails, message never arrives
		// new MessageTest().test();

		// fails with RAPI-1003 instead of RAPI-1014
		// new AlreadyDeletedTest().test();

		// possible missing tests:
		// - user removed from team separate from deleted users
		// - non-orphaned users not deleted
		// - messaging on team channel
		// - revoke user permissions to read team channel
	}
}

module.exports = new DeleteCompanyRequestTester();