// handle unit tests for the "POST /markers" request to create a marker

'use strict';

const PostMarkerTest = require('./post_marker_test');
const TeamNotFoundTest = require('./team_not_found_test');
const ACLTeamTest = require('./acl_team_test');
const StreamNoMatchTeamTest = require('./stream_no_match_team_test');
const NotFileStreamTest = require('./not_file_stream_test');
const NoAttributeTest = require('./no_attribute_test');

class PostMarkerRequestTester {

	postMarkerTest () {
		new PostMarkerTest().test();
		new TeamNotFoundTest().test();
		new ACLTeamTest().test();
		new StreamNoMatchTeamTest().test();
		new NotFileStreamTest({ streamType: 'channel' }).test();
		new NotFileStreamTest({ streamType: 'direct' }).test();
		new NoAttributeTest({ attribute: 'providerType' }).test();
		new NoAttributeTest({ attribute: 'postStreamId' }).test();
		new NoAttributeTest({ attribute: 'postId' }).test();
		new NoAttributeTest({ attribute: 'code' }).test();
	}
}

module.exports = PostMarkerRequestTester;
