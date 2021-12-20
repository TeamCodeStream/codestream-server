// handle unit tests for the "POST /nr-comments/assign" request,
// to assign a New Relic object to a user

'use strict';

const AssignNRObjectTest = require('./assign_nr_object_test');
const NoAccountIdTest = require('./no_account_id_test');
const NoSecretTest = require('./no_secret_test');
const IncorrectSecretTest = require('./incorrect_secret_test');
const ParameterRequiredTest = require('./parameter_required_test');
const InvalidParameterTest = require('./invalid_parameter_test');
const UnknownObjectTypeTest = require('./unknown_object_type_test');
const IncorrectAccountIdTest = require('./incorrect_account_id_test');
const ExistingObjectTest = require('./existing_object_test');
const IncorrectExistingAccountIdTest = require('./incorrect_existing_account_id_test');
const NoMatchAccountIdTest = require('./no_match_account_id_test');
const FetchObjectTest = require('./fetch_object_test');
const CreatorEmailRequiredTest = require('./creator_email_required_test');
const AssigneeEmailRequiredTest = require('./assignee_email_required_test');
const InvalidCreatorEmailTest = require('./invalid_creator_email_test');
const InvalidAssigneeEmailTest = require('./invalid_assignee_email_test');
const FetchAssignerTest = require('./fetch_assigner_test');
const FetchAssigneeTest = require('./fetch_assignee_test');
/*
const ExistingFauxUserAssignerTest = require('./existing_faux_user_assigner_test');
const ExistingRegisteredUserTest = require('./existing_registered_user_test');
const MentionsTest = require('./mentions_test');
const MentionRegisteredUserTest = require('./mentioned_registered_user_test');
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
const MessageToTeamChannelTest = require('./message_to_team_channel_test');
const MessageToTeamChannelFromCodeStreamCodeErrorTest = require('./message_to_team_channel_from_codestream_code_error_test');
const ReplyTest = require('./reply_test');
const ForeginMembersTest = require('./foreign_members_test');
const ForeignMembersMessageToTeamTest = require('./foreign_members_message_to_team_test');
*/

class AssignNRCommentRequestTester {

	test () {
		new AssignNRObjectTest().test();
		new NoSecretTest().test();
		new IncorrectSecretTest().test();
		new NoAccountIdTest().test();
		new ParameterRequiredTest({ parameter: 'creator' }).test();
		new ParameterRequiredTest({ parameter: 'assignee' }).test();
		new ParameterRequiredTest({ parameter: 'accountId' }).test();
		new ParameterRequiredTest({ parameter: 'objectId' }).test();
		new ParameterRequiredTest({ parameter: 'objectType' }).test();
		new InvalidParameterTest({ parameter: 'creator' }).test();
		new InvalidParameterTest({ parameter: 'assignee' }).test();
		new InvalidParameterTest({ parameter: 'accountId', shouldBeNumber: true }).test();
		new InvalidParameterTest({ parameter: 'objectId' }).test();
		new InvalidParameterTest({ parameter: 'objectType' }).test();
		new UnknownObjectTypeTest().test();
		new IncorrectAccountIdTest().test();
		new ExistingObjectTest().test();
		new IncorrectExistingAccountIdTest().test();
		new NoMatchAccountIdTest().test();
		new FetchObjectTest().test();
		new CreatorEmailRequiredTest().test();
		new AssigneeEmailRequiredTest().test();
		new InvalidCreatorEmailTest().test();
		new InvalidAssigneeEmailTest().test();
		new FetchAssignerTest().test();
		new FetchAssigneeTest().test();
		/*
		new ExistingFauxUserAssignerTest().test();
		new ExistingRegisteredUserTest().test();
		new MentionsTest().test();
		new MentionRegisteredUserTest().test();
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
		new MessageToTeamChannelTest().test();
		new MessageToTeamChannelFromCodeStreamCodeErrorTest().test();
		new ReplyTest().test();
		new ForeginMembersTest().test();
		new ForeignMembersMessageToTeamTest().test();
		*/
	}
}

module.exports = new AssignNRCommentRequestTester();
