// handle unit tests for the "DELETE /nr-comments/:id" request,
// to delete a New Relic comment through the comment engine

'use strict';

const DeleteNRCommentTest = require('./delete_nr_comment_test');
const NoSecretTest = require('./no_secret_test');
const NoAccountIdTest = require('./no_account_id_test');
const IncorrectSecretTest = require('./incorrect_secret_test');
const NotFoundTest = require('./not_found_test');
const AccountIdMismatchTest = require('./account_id_mismatch_test');
const DeleteClaimedNRCommentTest = require('./delete_claimed_nr_comment_test');
const DeleteReplyTest = require('./delete_reply_test');
const NonChildPostTest = require('./non_child_post_test');
const NoCodeErrorPostTest = require('./no_code_error_post_test');
const NonCodeErrorPostTest = require('./non_code_error_post_test');
const FetchTest = require('./fetch_test');
const MessageTest = require('./message_test');

class PutNRCommentRequestTester {

	test () {
		new DeleteNRCommentTest().test();
		new NoSecretTest().test();
		new NoAccountIdTest().test();
		new IncorrectSecretTest().test();
		new NotFoundTest().test();
		new AccountIdMismatchTest().test();
		new DeleteClaimedNRCommentTest().test();
		new DeleteReplyTest().test();
		new NonChildPostTest().test();
		new NoCodeErrorPostTest().test();
		new NonCodeErrorPostTest().test();
		new FetchTest().test();
		new MessageTest().test();
	}
}

module.exports = new PutNRCommentRequestTester();
