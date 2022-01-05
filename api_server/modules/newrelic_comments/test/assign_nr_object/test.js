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
const ExistingFauxUserAssignerTest = require('./existing_faux_user_assigner_test');
const ExistingRegisteredAssignerTest = require('./existing_registered_assigner_test');
const NewRelicUserIdForAssignerTest = require('./new_relic_user_id_for_assigner_test');
const NewRelicUserIdForAssigneeTest = require('./new_relic_user_id_for_assignee_test');
const NewRelicUserIdExistingAssignerTest = require('./new_relic_user_id_existing_assigner_test');
const NewRelicUserIdExistingAssigneeTest = require('./new_relic_user_id_existing_assignee_test');
const ForeginMembersTest = require('./foreign_members_test');
const ForeginMemberAssignerTest = require('./foreign_member_assigner_test');
const ForeginMemberAssigneeTest = require('./foreign_member_assignee_test');
const ForeignMembersMessageToTeamTest = require('./foreign_members_message_to_team_test');
const EmailNotificationTest = require('./email_notification_test');

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
		new ExistingFauxUserAssignerTest().test();
		new ExistingRegisteredAssignerTest().test();
		new NewRelicUserIdForAssignerTest().test();
		new NewRelicUserIdForAssigneeTest().test();
		new NewRelicUserIdExistingAssignerTest().test();
		new NewRelicUserIdExistingAssigneeTest().test();
		new ForeginMembersTest().test();
		new ForeginMemberAssignerTest().test();
		new ForeginMemberAssigneeTest().test();
		new ForeignMembersMessageToTeamTest().test();
		new EmailNotificationTest().test();
	}
}

module.exports = new AssignNRCommentRequestTester();
