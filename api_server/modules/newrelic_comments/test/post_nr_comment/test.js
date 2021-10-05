// handle unit tests for the "POST /nr-comments" request,
// to create a New Relic comment

'use strict';

const CreateNRCommentTest = require('./create_nr_comment_test');
const NoAccountIdTest = require('./no_account_id_test');
const NoSecretTest = require('./no_secret_test');
const IncorrectSecretTest = require('./incorrect_secret_test');
const ParameterRequiredTest = require('./parameter_required_test');
const InvalidParameterTest = require('./invalid_parameter_test');
const UnknownObjectTypeTest = require('./unknown_object_type_test');
const IncorrectAccountIdTest = require('./incorrect_account_id_test');
const ExistingObjectTest = require('./existing_object_test');
const IncorrectExistingAccountIdTest = require('./incorrect_existing_account_id_test');
const FetchTest = require('./fetch_test');
const FetchObjectTest = require('./fetch_object_test');
const EmailRequiredTest = require('./email_required_test');
const InvalidEmailTest = require('./invalid_email_test');
const FetchUserTest = require('./fetch_user_test');
const ExistingFauxUserTest = require('./existing_faux_user_test');
const ExistingRegisteredUserTest = require('./existing_registered_user_test');
const MentionsTest = require('./mentions_test');
const MentionRegisteredUserTest = require('./mentioned_registered_user_test');
const NoMatchAccountIdTest = require('./no_match_account_id_test');
const NewRelicUserIdTest = require('./new_relic_user_id_test');
const NewRelicUserIdExistingTest = require('./new_relic_user_id_existing_test');
const NewRelicUserIdReplaceTest = require('./new_relic_user_id_replace_test');
const NestedCommentTest = require('./nested_comment_test');
const NumRepliesTest = require('./num_replies_test');
const NoReplyToNestedTest = require('./no_reply_to_nested_test');
const ParentPostNotFoundTest = require('./parent_post_not_found_test');
const ReplyToWrongCodeErrorTest = require('./reply_to_wrong_code_error_test');
const ReplyToWrongReplyTest = require('./reply_to_wrong_reply_test');
const ReplyToNonNRObjectTest = require('./reply_to_non_nr_object_test');
const ReplyToNonNRObjectReplyTest = require('./reply_to_non_nr_object_reply_test');
const MessageToObjectChannelTest = require('./message_to_object_channel_test');
const MessageToObjectChannelFromCodeStreamCodeErrorTest = require('./message_to_object_channel_from_codestream_code_error_test');

class PostNRCommentRequestTester {

	test () {
		new CreateNRCommentTest().test();
		new NoSecretTest().test();
		new IncorrectSecretTest().test();
		new NoAccountIdTest().test();
		new ParameterRequiredTest({ parameter: 'creator' }).test();
		new ParameterRequiredTest({ parameter: 'accountId' }).test();
		new ParameterRequiredTest({ parameter: 'objectId' }).test();
		new ParameterRequiredTest({ parameter: 'objectType' }).test();
		new ParameterRequiredTest({ parameter: 'text' }).test();
		new InvalidParameterTest({ parameter: 'creator' }).test();
		new InvalidParameterTest({ parameter: 'accountId', shouldBeNumber: true }).test();
		new InvalidParameterTest({ parameter: 'objectId' }).test();
		new InvalidParameterTest({ parameter: 'objectType' }).test();
		new InvalidParameterTest({ parameter: 'text' }).test();
		new UnknownObjectTypeTest().test();
		new IncorrectAccountIdTest().test();
		new ExistingObjectTest().test();
		new IncorrectExistingAccountIdTest().test();
		new FetchTest().test();
		new FetchObjectTest().test();
		new EmailRequiredTest().test();
		new InvalidEmailTest().test();
		new FetchUserTest().test();
		new ExistingFauxUserTest().test();
		new ExistingRegisteredUserTest().test();
		new MentionsTest().test();
		new MentionRegisteredUserTest().test();
		new NoMatchAccountIdTest().test();
		new NewRelicUserIdTest().test();
		new NewRelicUserIdExistingTest().test();
		new NewRelicUserIdReplaceTest().test();
		new NestedCommentTest().test();
		new NumRepliesTest().test();
		new NoReplyToNestedTest().test();
		new ParentPostNotFoundTest().test();
		new ReplyToWrongCodeErrorTest().test();
		new ReplyToWrongReplyTest().test();
		new ReplyToNonNRObjectTest().test();
		new ReplyToNonNRObjectReplyTest().test();
		new MessageToObjectChannelTest().test();
		new MessageToObjectChannelFromCodeStreamCodeErrorTest().test();
	}
}

module.exports = new PostNRCommentRequestTester();
