// handle unit tests for the "GET /nr-comments" request

'use strict';

const GetNRCommentsTest = require('./get_nr_comments_test');
const NoSecretTest = require('./no_secret_test');
const IncorrectSecretTest = require('./incorrect_secret_test');
const NoAccountIdTest = require('./no_account_id_test');
const NotFoundTest = require('./not_found_test');
const AccountIdMismatchTest = require('./account_id_mismatch_test');
const RepliesTest = require('./replies_test');
const ClaimedTest = require('./claimed_test');
const CodemarksTest = require('./codemarks_test');
const CodemarksAndRepliesTest = require('./codemarks_and_replies_test');

class GetNRCommentsRequestTester {

	test () {
		new GetNRCommentsTest().test();
		new NoSecretTest().test();
		new IncorrectSecretTest().test();
		new NoAccountIdTest().test();
		new NotFoundTest().test();
		new AccountIdMismatchTest().test();
		new RepliesTest().test();
		new ClaimedTest().test();
		new CodemarksTest().test();
		new CodemarksAndRepliesTest().test();
	}
}

module.exports = new GetNRCommentsRequestTester();
