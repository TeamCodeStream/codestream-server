// handle unit tests for the "POST /code-errors/claim/:teamId" request to claim a code error
// for a team

'use strict';

const ClaimCodeErrorTest = require('./claim_code_error_test');
const ACLTeamTest = require('./acl_team_test');
const ParameterRequiredTest = require('./parameter_required_test');
const NotFoundTest = require('./not_found_test');
const AlreadyClaimedByTeamTest = require('./already_claimed_by_team_test');
const ClaimedByOtherTeamTest = require('./claimed_by_other_team_test');
const ChildPostsClaimedTest = require('./child_posts_claimed_test');
const ForeignUsersTest = require('./foreign_users_test');
const NotAddedAsForeignUsersTest = require('./not_added_as_foreign_users_test');
const ExternalForeignUsersTest = require('./external_foreign_users_test');
const FetchCodeErrorTest = require('./fetch_code_error_test');
const FetchStreamTest = require('./fetch_stream_test');
const MessageTest = require('./message_test');
const NoNRTokenTest = require('./no_nr_token_test');
const NRAccountAclTest = require('./nr_account_acl_test');
const NRAccountTest = require('./nr_account_test');

class ClaimCodeErrorRequestTester {

	test () {
		new ClaimCodeErrorTest().test();
		new ACLTeamTest().test();
		new ParameterRequiredTest({ parameter: 'objectId' }).test();
		new ParameterRequiredTest({ parameter: 'objectType' }).test();
		new NotFoundTest().test();
		new AlreadyClaimedByTeamTest().test();
		new ClaimedByOtherTeamTest().test();
		new ChildPostsClaimedTest().test();
		new ForeignUsersTest().test();
		new NotAddedAsForeignUsersTest().test();
		new ExternalForeignUsersTest().test();
		new FetchCodeErrorTest().test();
		new FetchStreamTest().test();
		new MessageTest().test();
		new NoNRTokenTest().test();
		new NRAccountAclTest().test();
		new NRAccountTest().test();
	}
}

module.exports = new ClaimCodeErrorRequestTester();
