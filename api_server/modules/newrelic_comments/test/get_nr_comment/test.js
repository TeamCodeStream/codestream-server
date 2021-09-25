// handle unit tests for the "GET /nr-comments/:id" request,
// to fetch a New Relic comment

'use strict';

const GetNRCommentTest = require('./get_nr_comment_test');
const NoAccountIdTest = require('./no_account_id_test');
const NoSecretTest = require('./no_secret_test');
const IncorrectSecretTest = require('./incorrect_secret_test');
const NotFoundTest = require('./not_found_test');
const NonChildPostTest = require('./non_child_post_test');
const NonNRObjectTest = require('./non_nr_object_test');
const NonNRObjectCodemarkTest = require('./non_nr_object_codemark_test');
const ReplyTest = require('./reply_test');
const NonNRNestedReplyTest = require('./non_nr_nested_reply_test');
const AccountIdMismatchTest = require('./account_id_mismatch_test');
const ReactionsTest = require('./reactions_test');
const CodeStreamPostReplyTest= require('./codestream_post_reply_test');
const FilesTest = require('./files_test');
const CodeBlocksTest = require('./code_blocks_test');

class GetNRCommentRequestTester {

	test () {
		new GetNRCommentTest().test();
		new NoSecretTest().test();
		new IncorrectSecretTest().test();
		new NoAccountIdTest().test();
		new NotFoundTest().test();
		new NonChildPostTest().test();
		new NonNRObjectTest().test();
		new NonNRObjectCodemarkTest().test();
		new ReplyTest().test();
		new NonNRNestedReplyTest().test();
		new AccountIdMismatchTest().test();
		new ReactionsTest().test();
		new CodeStreamPostReplyTest().test();
		new FilesTest().test();
		new CodeBlocksTest().test();
	}
}

module.exports = new GetNRCommentRequestTester();
