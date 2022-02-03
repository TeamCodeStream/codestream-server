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
const NonOrphanedNotDeletedTest = require('./non_orphaned_not_deleted_test');
const TeamSubscriptionRevokedTest = require('./team_subscription_revoked_test');
const DeactivatedUserTest = require('./deactivated_user_test');

class DeleteCompanyRequestTester {

	test () {
		new DeleteCompanyTest().test();
		new DeleteCompanyFetchTest().test();
		new MessageTest().test();
		new ACLTest().test();
		new TeamDeletedTest().test();
		new UserDeletedTest().test();
		new CompanyNotFoundTest().test();
		new NonOrphanedNotDeletedTest().test();
		new AlreadyDeletedTest().test();
		new TeamSubscriptionRevokedTest().test();
		new DeactivatedUserTest().test();
	}
}

module.exports = new DeleteCompanyRequestTester();