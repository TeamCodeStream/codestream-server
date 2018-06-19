// handle unit tests for the "POST /teams" request to create a team

'use strict';

const PostTeamTest = require('./post_team_test');
const NoAttributeTest = require('./no_attribute_test');
const CantProvideEmailsTest = require('./cant_provide_emails_test');
const CantProvideUsersTest = require('./cant_provide_users_test');
const WebmailCompanyNameTest = require('./webmail_company_name_test');
const CreateTeamJoinMethodTest = require('./create_team_join_method_test');
const AlreadyOnTeamNoCreatedTeamJoinMethodTest = require('./already_on_team_no_created_team_join_method_test');
const CreateSecondTeamTest = require('./create_second_team_test');
const SubscriptionTest = require('./subscription_test');

class PostTeamRequestTester {

	postTeamTest () {
		new PostTeamTest().test();
		new NoAttributeTest({ attribute: 'name' }).test();
		new CantProvideEmailsTest().test();
		new CantProvideUsersTest().test();
		new WebmailCompanyNameTest().test();
		new CreateTeamJoinMethodTest().test();
		new AlreadyOnTeamNoCreatedTeamJoinMethodTest().test();
		new CreateSecondTeamTest().test();
		new SubscriptionTest().test();
	}
}

module.exports = PostTeamRequestTester;
