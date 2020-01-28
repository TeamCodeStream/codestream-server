// handle unit tests for the "POST /teams" request to create a team

'use strict';

const PostTeamTest = require('./post_team_test');
const NoAttributeTest = require('./no_attribute_test');
const CantProvideEmailsTest = require('./cant_provide_emails_test');
const CantProvideUsersTest = require('./cant_provide_users_test');
const WebmailCompanyNameTest = require('./webmail_company_name_test');
const MessageToUserTest = require('./message_to_user_test');
const AlreadyOnTeamNoCreatedTeamJoinMethodTest = require('./already_on_team_no_created_team_join_method_test');
const CreateSecondTeamTest = require('./create_second_team_test');
const SubscriptionTest = require('./subscription_test');
const CompanyOnTheFlyTest = require('./company_on_the_fly_test');
const AttachToCompanyTest = require('./attach_to_company_test');
const AttachToCompanyMessageToUserTest = require('./attach_to_company_message_to_user_test');
const AttachToCompanyNotFoundTest = require('./attach_to_company_not_found_test');
const AttachToCompanyACLTest = require('./attach_to_company_acl_test');

class PostTeamRequestTester {

	postTeamTest () {
		new PostTeamTest().test();
		new NoAttributeTest({ attribute: 'name' }).test();
		new CantProvideEmailsTest().test();
		new CantProvideUsersTest().test();
		new WebmailCompanyNameTest().test();
		new MessageToUserTest().test();
		new AlreadyOnTeamNoCreatedTeamJoinMethodTest().test();
		new CreateSecondTeamTest().test();
		new SubscriptionTest().test();
		new CompanyOnTheFlyTest().test();
		new AttachToCompanyTest().test();
		new AttachToCompanyMessageToUserTest().test();
		new AttachToCompanyNotFoundTest().test();
		new AttachToCompanyACLTest().test();
	}
}

module.exports = PostTeamRequestTester;
