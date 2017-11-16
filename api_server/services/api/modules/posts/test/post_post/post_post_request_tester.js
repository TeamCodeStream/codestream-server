'use strict';

var PostPostTest = require('./post_post_test');
var PostToDirectTest = require('./post_to_direct_test');
var PostToChannelTest = require('./post_to_channel_test');
var PostToFileStreamTest = require('./post_to_file_stream_test');
var PostLocationToFileStreamTest = require('./post_location_to_file_stream_test');
var PostReplyTest = require('./post_reply_test');
var NoStreamIdTest = require('./no_stream_id_test');
var InvalidStreamIdTest = require('./invalid_stream_id_test');
var DirectOnTheFlyTest = require('./direct_on_the_fly_test');
var ChannelOnTheFlyTest = require('./channel_on_the_fly_test');
var FileStreamOnTheFlyTest = require('./file_stream_on_the_fly_test');
var InvalidRepoIdTest = require('./invalid_repo_id_test');
var NoStreamAttributeTest = require('./no_stream_attribute_test');
var InvalidTeamIdTest = require('./invalid_team_id_test');
var DuplicateChannelTest = require('./duplicate_channel_test');
var DuplicateDirectTest = require('./duplicate_direct_test');
var DuplicateFileStreamTest = require('./duplicate_file_stream_test');
var InvalidTypeTest = require('./invalid_type_test');
var MeDirectTest = require('./me_direct_test');
var MeChannelTest = require('./me_channel_test');
var NameRequiredTest = require('./name_required_test');
var NoFileTest = require('./no_file_test');
var NoRepoIdTest = require('./no_repo_id_test');
var ACLTeamTest = require('./acl_team_test');
var ACLStreamTest = require('./acl_stream_test');
var ACLTeamOnTheFlyTest = require('./acl_team_on_the_fly_test');
var ACLRepoOnTheFlyTest = require('./acl_repo_on_the_fly_test');
var NewPostMessageToTeamTest = require('./new_post_message_to_team_test');
var NewPostMessageToStreamTest = require('./new_post_message_to_stream_test');
var NewPostNoMessageTest = require('./new_post_no_message_test');
var NewFileStreamMessageToTeamTest = require('./new_file_stream_message_to_team_test');
var NewStreamMessageToMembersTest = require('./new_stream_message_to_members_test');
var NewStreamNoMessageTest = require('./new_stream_no_message_test');
var MostRecentPostTest = require('./most_recent_post_test');
var LastReadsNoneTest = require('./last_reads_none_test');
var NoLastReadsForAuthorTest = require('./no_last_reads_for_author_test');
var LastReadsPreviousPostTest = require('./last_reads_previous_post_test');
var NoLastReadsUpdateTest = require('./no_last_reads_update_test');

/* jshint -W071 */

class PostPostRequestTester {

	postPostTest () {
		new PostPostTest().test();
		new PostToDirectTest().test();
		new PostToChannelTest().test();
		new PostToFileStreamTest().test();
		new PostLocationToFileStreamTest().test();
		new PostReplyTest().test();
		new NoStreamIdTest().test();
		new InvalidStreamIdTest().test();
		new DirectOnTheFlyTest().test();
		new ChannelOnTheFlyTest().test();
		new FileStreamOnTheFlyTest().test();
		new InvalidRepoIdTest().test();
		new NoStreamAttributeTest({ attribute: 'teamId' }).test();
		new NoStreamAttributeTest({ attribute: 'type' }).test();
		new InvalidTeamIdTest().test();
		new DuplicateChannelTest().test();
		new DuplicateDirectTest().test();
		new DuplicateFileStreamTest().test();
		new InvalidTypeTest().test();
		new MeDirectTest().test();
		new MeChannelTest().test();
		new NameRequiredTest().test();
		new NoFileTest().test();
		new NoRepoIdTest().test();
		new ACLTeamTest({ }).test();
		new ACLStreamTest().test();
		new ACLTeamOnTheFlyTest().test();
		new ACLRepoOnTheFlyTest().test();
		new NewPostMessageToTeamTest().test();
		new NewPostMessageToStreamTest({ type: 'channel' }).test();
		new NewPostMessageToStreamTest({ type: 'direct' }).test();
		new NewPostNoMessageTest({ type: 'channel' }).test();
		new NewPostNoMessageTest({ type: 'direct' }).test();
		new NewFileStreamMessageToTeamTest().test();
		new NewStreamMessageToMembersTest({ type: 'channel' }).test();
		new NewStreamMessageToMembersTest({ type: 'direct' }).test();
		new NewStreamNoMessageTest({ type: 'channel' }).test();
		new NewStreamNoMessageTest({ type: 'direct' }).test();
		new MostRecentPostTest().test();
		new LastReadsNoneTest({ type: 'direct' }).test();
		new LastReadsNoneTest({ type: 'channel' }).test();
		new LastReadsNoneTest({ type: 'file' }).test();
		new NoLastReadsForAuthorTest().test();
		new LastReadsPreviousPostTest({ type: 'direct' }).test();
		new LastReadsPreviousPostTest({ type: 'channel' }).test();
		new LastReadsPreviousPostTest({ type: 'file' }).test();
		new NoLastReadsUpdateTest().test();
	}
}

/* jshint +W071 */

module.exports = PostPostRequestTester;
