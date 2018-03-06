// unit tests associated with the "POST /no-auth/slack-post" request,
// for accepting incoming messages from the slack integration

'use strict';

const SlackPostTest = require('./slack_post_test');
const SlackPostMessageTest = require('./slack_post_message_test');
//const ACLTest = require('./acl_test');
const MissingParameterTest = require('./missing_parameter_test');
//const IncorrectSecretTest = require('./incorrect_secret_test');
const TeamNotFoundTest = require('./team_not_found_test');
const RepoNotFoundTest = require('./repo_not_found_test');
const StreamNotFoundTest = require('./stream_not_found_test');
const ParentPostNotFoundTest = require('./parent_post_not_found_test');
const RepoNoMatchTeamTest = require('./repo_no_match_team_test');
const StreamNoMatchRepoTest = require('./stream_no_match_repo_test');
const ParentPostNoMatchStreamTest = require('./parent_post_no_match_stream_test');
const UserNotOnTeamTest = require('./user_not_on_team_test');
const UsernameConflictTest = require('./username_conflict_test');
const NewUserTest = require('./new_user_test');
const TrackingTest = require('./tracking_test');
const NoTrackingTest = require('./no_tracking_test');
const NewUserMessageTest = require('./new_user_message_test');

class SlackPostRequestTester {

	test () {
		new SlackPostTest().test();
		new SlackPostMessageTest().test();
//		new ACLTest().test();
		new MissingParameterTest({ parameter: 'teamId' }).test();
		new MissingParameterTest({ parameter: 'repoId' }).test();
		new MissingParameterTest({ parameter: 'streamId' }).test();
		new MissingParameterTest({ parameter: 'authorEmail' }).test();
		new MissingParameterTest({ parameter: 'authorUsername' }).test();
		new MissingParameterTest({ parameter: 'parentPostId' }).test();
		new MissingParameterTest({ parameter: 'text' }).test();
//		new IncorrectSecretTest().test();
		new TeamNotFoundTest().test();
		new RepoNotFoundTest().test();
		new StreamNotFoundTest().test();
		new ParentPostNotFoundTest().test();
		new RepoNoMatchTeamTest().test();
		new StreamNoMatchRepoTest().test();
		new ParentPostNoMatchStreamTest().test();
		new UserNotOnTeamTest().test();
		new UsernameConflictTest().test();
		new NewUserTest().test();
		new TrackingTest().test();
		new NoTrackingTest().test();
		new NewUserMessageTest().test();
	}
}

module.exports = new SlackPostRequestTester();
