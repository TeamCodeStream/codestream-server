// handle unit tests for the "PUT /editing" request

'use strict';

const EditingTest = require('./editing_test');
const NoParameterTest = require('./no_parameter_test');
const ACLTest = require('./acl_test');
const StreamNotFoundTest = require('./stream_not_found_test');
const NoEditingNonFileTest = require('./no_editing_non_file_test');
const FindStreamTest = require('./find_stream_test');
const NoMatchTeamTest = require('./no_match_team_test');
//const NoMatchRepoTest = require('./no_match_repo_test');
const CreateStreamTest = require('./create_stream_test');
const NoOpTest = require('./no_op_test');
const AlreadyEditingTest = require('./already_editing_test');
const StopEditingTest = require('./stop_editing_test');
const MessageToTeamTest = require('./message_to_team_test');
const MessageToTeamFindStreamTest = require('./message_to_team_find_stream_test');
const MessageToTeamCreateStreamTest = require('./message_to_team_create_stream_test');
const NoMessageOnNoOpTest = require('./no_message_on_no_op_test');
const NoMessageOnAlreadyEditingTest = require('./no_message_on_already_editing_test');
const StopEditingMessageTest = require('./stop_editing_message_test');
const MultipleEditingTest = require('./multiple_editing_test');
const MultipleMessageToTeamTest = require('./multiple_message_to_team_test');

class EditingRequestTester {

	editingTest () {
		new EditingTest().test();
		new NoParameterTest({ parameter: 'teamId' }).test();
		new NoParameterTest({ parameter: 'repoId' }).test();
		new NoParameterTest({ parameter: 'editing' }).test();
		new NoParameterTest({ parameter: 'streamId' }).test();
		new ACLTest().test();
		new StreamNotFoundTest().test();
		new NoEditingNonFileTest({ type: 'channel' }).test();
		new NoEditingNonFileTest({ type: 'direct' }).test();
		new FindStreamTest().test();
		new NoMatchTeamTest().test();
		//new NoMatchRepoTest().test();
		new CreateStreamTest().test();
		new NoOpTest().test();
		new AlreadyEditingTest().test();
		new StopEditingTest().test();
		new MessageToTeamTest().test();
		new MessageToTeamFindStreamTest().test();
		new MessageToTeamCreateStreamTest().test();
		new NoMessageOnNoOpTest().test();
		new NoMessageOnAlreadyEditingTest().test();
		new StopEditingMessageTest().test();
		new MultipleEditingTest().test();
		new MultipleMessageToTeamTest().test();
	}
}

module.exports = EditingRequestTester;
