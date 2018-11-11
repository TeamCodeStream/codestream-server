// handle unit tests for the "PUT /posts" request

'use strict';

const DeletePostTest = require('./delete_post_test');
const DeletePostFetchTest = require('./delete_post_fetch_test');
const DeleteCodemarkTest = require('./delete_codemark_test');
const DeleteCodemarkFetchTest = require('./delete_codemark_fetch_test');
const DeleteMarkerTest = require('./delete_marker_test');
const DeleteMarkerFetchTest = require('./delete_marker_fetch_test');
const NumRepliesTest = require('./num_replies_test');
const NumRepliesCodemarkTest = require('./num_replies_codemark_test');
const ACLTest = require('./acl_test');
const ACLTeamTest = require('./acl_team_test');
const PostNotFoundTest = require('./post_not_found_test');
const AlreadyDeletedTest = require('./already_deleted_test');
const AdminCanDeleteTest = require('./admin_can_delete_test');
const MessageTest = require('./message_test');
const CodemarkMessageTest = require('./codemark_message_test');
const MarkerMessageTest = require('./marker_message_test');

class DeletePostRequestTester {

	deletePostTest () {
		new DeletePostTest().test();
		new DeletePostFetchTest().test();
		new DeleteCodemarkTest().test();
		new DeleteCodemarkFetchTest().test();
		new DeleteMarkerTest().test();
		new DeleteMarkerFetchTest().test();
		new NumRepliesTest().test();
		new NumRepliesCodemarkTest().test();
		new ACLTest().test();
		new ACLTeamTest().test();
		new PostNotFoundTest().test();
		new AlreadyDeletedTest().test();
		new AdminCanDeleteTest().test();
		new MessageTest({ streamType: 'channel' }).test();
		new MessageTest({ streamType: 'direct' }).test();
		new MessageTest({ streamType: 'team stream' }).test();
		new CodemarkMessageTest({ streamType: 'channel' }).test();
		new CodemarkMessageTest({ streamType: 'direct' }).test();
		new CodemarkMessageTest({ streamType: 'team stream' }).test();
		new MarkerMessageTest({ streamType: 'channel' }).test();
		new MarkerMessageTest({ streamType: 'direct' }).test();
	}
}

module.exports = DeletePostRequestTester;
