// handle unit tests for the "PUT /nr-comments/:id" request,
// to update a New Relic comment through the comment engine

'use strict';

const UpdateNRCommentTest = require('./update_nr_comment_test');
const NoSecretTest = require('./no_secret_test');
const NoAccountIdTest = require('./no_account_id_test');
const IncorrectSecretTest = require('./incorrect_secret_test');
const NotFoundTest = require('./not_found_test');
const AccountIdMismatchTest = require('./account_id_mismatch_test');
const UpdateClaimedNRCommentTest = require('./update_claimed_nr_comment_test');
const UpdateReplyTest = require('./update_reply_test');
const NonChildPostTest = require('./non_child_post_test');
const NoCodeErrorPostTest = require('./no_code_error_post_test');
const NonCodeErrorPostTest = require('./non_code_error_post_test');
const MentionTest = require('./mention_test');
const MentionExistingTest = require('./mention_registered_test');
const MentionRegisteredTest = require('./mention_existing_test');
const FetchTest = require('./fetch_test');
const MessageTest = require('./message_test');
const ForeginMembersTest = require('./foreign_members_test');
const ForeignMembersMessageToTeamTest = require('./foreign_members_message_to_team_test');

class PutNRCommentRequestTester {

	test () {
		new UpdateNRCommentTest().test();
		new NoSecretTest().test();
		new IncorrectSecretTest().test();
		new NoAccountIdTest().test();
		new NotFoundTest().test();
		new AccountIdMismatchTest().test();
		new UpdateClaimedNRCommentTest().test();
		new UpdateReplyTest().test();
		new NonChildPostTest().test();
		new NoCodeErrorPostTest().test();
		new NonCodeErrorPostTest().test();
		new MentionTest().test();
		new MentionExistingTest().test();
		new MentionRegisteredTest().test();
		new FetchTest().test();
		new MessageTest().test();
		new ForeginMembersTest().test();
		new ForeignMembersMessageToTeamTest().test();
	}
}

module.exports = new PutNRCommentRequestTester();
