// handle unit tests for the "PUT /markers/:id/move" request,
// to move a marker

'use strict';

const CreateNRCommentTest = require('./create_nr_comment_test');
const NoSecretTest = require('./no_secret_test');
const IncorrectSecretTest = require('./incorrect_secret_test');
const ParameterRequiredTest = require('./parameter_required_test');
const InvalidParameterTest = require('./invalid_parameter_test');
const UnknownObjectTypeTest = require('./unknown_object_type_test');
/*
const FetchSupersededMarkerTest = require('./fetch_superseded_marker_test');
const FetchCodemarkTest = require('./fetch_codemark_test');
const ACLTest = require('./acl_test');
const MarkerNotFoundTest = require('./marker_not_found_test');
const CommitHashRequiredTest = require('./commit_hash_required_test');
const InvalidLocation = require('./invalid_location_test');
const NoSetAttributeTest = require('./no_set_attribute_test');
const TooManyRemotesTest = require('./too_many_remotes_test');
const RepoNotFoundTest = require('./repo_not_found_test');
const StreamNotFoundTest = require('./stream_not_found_test');
const InvalidFileStreamTest = require('./invalid_file_stream_test');
const StreamForWrongTeamTest = require('./stream_for_wrong_team_test');
const MessageToTeamTest = require('./message_to_team_test');
*/

class PostNRCommentRequestTester {

	test () {
		new CreateNRCommentTest().test();
		/*
		new NoSecretTest().test();
		new IncorrectSecretTest().test();
		new ParameterRequiredTest({ parameter: 'creator' }).test();
		new ParameterRequiredTest({ parameter: 'accountId' }).test();
		new ParameterRequiredTest({ parameter: 'objectId' }).test();
		new ParameterRequiredTest({ parameter: 'objectType' }).test();
		new ParameterRequiredTest({ parameter: 'text' }).test();
		new InvalidParameterTest({ parameter: 'creator' }).test();
		new InvalidParameterTest({ parameter: 'accountId', shouldBeNumber: true }).test();
		new InvalidParameterTest({ parameter: 'objectId' }).test();
		new InvalidParameterTest({ parameter: 'objectType' }).test();
		new UnknownObjectTypeTest().test();
		*/
		/*
		new FetchSupersededMarkerTest().test();
		new FetchCodemarkTest().test();
		new ACLTest().test();
		new MarkerNotFoundTest().test();
		new ParameterRequiredTest({ parameter: 'code' }).test();
		//new ParameterRequiredTest({ parameter: 'location' }).test();
		new CommitHashRequiredTest().test();
		new InvalidLocation().test();
		new NoSetAttributeTest({ attribute: 'teamId' }).test();
		new NoSetAttributeTest({ attribute: 'providerType' }).test();
		new NoSetAttributeTest({ attribute: 'postStreamId' }).test();
		new NoSetAttributeTest({ attribute: 'postId' }).test();
		new TooManyRemotesTest().test();
		new RepoNotFoundTest().test();
		new StreamNotFoundTest().test();
		new InvalidFileStreamTest().test();
		new StreamForWrongTeamTest().test();
		new MessageToTeamTest().test();
		*/
	}
}

module.exports = new PostNRCommentRequestTester();
