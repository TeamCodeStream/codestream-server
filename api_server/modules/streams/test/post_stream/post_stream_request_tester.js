// handle unit tests for the "POST /streams" request

'use strict';

const PostFileStreamTest = require('./post_file_stream_test');
const PostChannelStreamTest = require('./post_channel_stream_test');
const PostDirectStreamTest = require('./post_direct_stream_test');
const NoAttributeTest = require('./no_attribute_test');
const InvalidTypeTest = require('./invalid_type_test');
const NameRequiredTest = require('./name_required_test');
const NoRepoIdTest = require('./no_repo_id_test');
const NoFileTest = require('./no_file_test');
const TeamStreamMustBeChannelTest = require('./team_stream_must_be_channel_test');
const ChannelIgnoresFileTest = require('./channel_ignores_file_test');
const FileIgnoresChannelTest = require('./file_ignores_channel_test');
const DirectIgnoresFileTest = require('./direct_ignores_file_test');
const DirectIgnoresChannelTest = require('./direct_ignores_channel_test');
const MeDirectTest = require('./me_direct_test');
const MeChannelTest = require('./me_channel_test');
const DuplicateChannelTest = require('./duplicate_channel_test');
const DuplicateDirectTest = require('./duplicate_direct_test');
const DuplicateFileTest = require('./duplicate_file_test');
const ACLTest = require('./acl_test');
const NewFileStreamMessageToTeamTest = require('./new_file_stream_message_to_team_test');
const NewTeamStreamMessageToTeamTest = require('./new_team_stream_message_to_team_test');
const NewStreamToMembersTest = require('./new_stream_to_members_test');
const NewStreamNoMessageTest = require('./new_stream_no_message_test');
const PostTeamStreamTest = require('./post_team_stream_test');
const TeamStreamIgnoresPrivacyTest = require('./team_stream_ignores_privacy_test');
const TeamStreamIgnoresMembersTest = require('./team_stream_ignores_members_test');
const ChannelCanBePublicTest = require('./channel_can_be_public_test');
const InvalidPrivacyTest = require('./invalid_privacy_test');
const DirectStreamIgnoresPrivacyTest = require('./direct_stream_ignores_privacy_test');
const FileStreamIgnoresPrivacyTest = require('./file_stream_ignores_privacy_test');
const InvalidChannelNameTest = require('./invalid_channel_name_test');

const ILLEGAL_CHANNEL_NAME_CHARACTERS = '~#%&*{}+/<>?|\'".,';

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
		for (let char of ILLEGAL_CHANNEL_NAME_CHARACTERS) {
			new InvalidChannelNameTest({ illegalCharacter: char }).test();
		}
	}
}

module.exports = PostStreamRequestTester;
