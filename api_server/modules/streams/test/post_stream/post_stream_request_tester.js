// handle unit tests for the "POST /streams" request

'use strict';

var PostFileStreamTest = require('./post_file_stream_test');
var PostChannelStreamTest = require('./post_channel_stream_test');
var PostDirectStreamTest = require('./post_direct_stream_test');
var NoAttributeTest = require('./no_attribute_test');
var InvalidTypeTest = require('./invalid_type_test');
var NameRequiredTest = require('./name_required_test');
var NoRepoIdTest = require('./no_repo_id_test');
var NoFileTest = require('./no_file_test');
var TeamStreamMustBeChannelTest = require('./team_stream_must_be_channel_test');
var ChannelIgnoresFileTest = require('./channel_ignores_file_test');
var FileIgnoresChannelTest = require('./file_ignores_channel_test');
var DirectIgnoresFileTest = require('./direct_ignores_file_test');
var DirectIgnoresChannelTest = require('./direct_ignores_channel_test');
var MeDirectTest = require('./me_direct_test');
var MeChannelTest = require('./me_channel_test');
var DuplicateChannelTest = require('./duplicate_channel_test');
var DuplicateDirectTest = require('./duplicate_direct_test');
var DuplicateFileTest = require('./duplicate_file_test');
var ACLTest = require('./acl_test');
var NewFileStreamMessageToTeamTest = require('./new_file_stream_message_to_team_test');
var NewTeamStreamMessageToTeamTest = require('./new_team_stream_message_to_team_test');
var NewStreamToMembersTest = require('./new_stream_to_members_test');
var NewStreamNoMessageTest = require('./new_stream_no_message_test');
var PostTeamStreamTest = require('./post_team_stream_test');
var TeamStreamIgnoresPrivacyTest = require('./team_stream_ignores_privacy_test');
var TeamStreamIgnoresMembersTest = require('./team_stream_ignores_members_test');
var ChannelCanBePublicTest = require('./channel_can_be_public_test');
var InvalidPrivacyTest = require('./invalid_privacy_test');
var DirectStreamIgnoresPrivacyTest = require('./direct_stream_ignores_privacy_test');
var FileStreamIgnoresPrivacyTest = require('./file_stream_ignores_privacy_test');

class PostStreamRequestTester {

	postStreamTest () {
		new PostFileStreamTest().test();
		new PostChannelStreamTest().test();
		new PostDirectStreamTest().test();
		new NoAttributeTest({ attribute: 'teamId' }).test();
		new NoAttributeTest({ attribute: 'type' }).test();
		new InvalidTypeTest().test();
		new NameRequiredTest().test();
		new NoRepoIdTest().test();
		new NoFileTest().test();
		new TeamStreamMustBeChannelTest().test();
		new ChannelIgnoresFileTest().test();
		new FileIgnoresChannelTest().test();
		new DirectIgnoresFileTest().test();
		new DirectIgnoresChannelTest().test();
		new MeDirectTest().test();
		new MeChannelTest().test();
		new DuplicateChannelTest().test();
		new DuplicateDirectTest().test();
		new DuplicateFileTest().test();
		new ACLTest({ type: 'channel' }).test();
		new ACLTest({ type: 'direct' }).test();
		new ACLTest({ type: 'file' }).test();
		new NewFileStreamMessageToTeamTest().test();
		new NewTeamStreamMessageToTeamTest().test();
		new NewStreamToMembersTest({ type: 'direct' }).test();
		new NewStreamToMembersTest({ type: 'channel' }).test();
		new NewStreamNoMessageTest({ type: 'direct' }).test();
		new NewStreamNoMessageTest({ type: 'channel' }).test();
		new PostTeamStreamTest().test();
		new TeamStreamIgnoresPrivacyTest().test();
		new TeamStreamIgnoresMembersTest().test();
		new ChannelCanBePublicTest().test();
		new InvalidPrivacyTest().test();
		new DirectStreamIgnoresPrivacyTest().test();
		new FileStreamIgnoresPrivacyTest().test();
	}
}

module.exports = PostStreamRequestTester;
