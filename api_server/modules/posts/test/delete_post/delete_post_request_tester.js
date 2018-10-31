// handle unit tests for the "PUT /posts" request

'use strict';

const DeletePostTest = require('./delete_post_test');
const DeletePostFetchTest = require('./delete_post_fetch_test');
const ACLTest = require('./acl_test');
const ACLTeamTest = require('./acl_team_test');
const PostNotFoundTest = require('./post_not_found_test');
const AlreadyDeletedTest = require('./already_deleted_test');
const MessageTest = require('./message_test');
/*
const MarkerDeletedTest = require('./marker_deleted_test');
const MarkersDeletedMessageTest = require('./markers_deleted_message_test');
const DeleteReplyToMarkerTest = require('./delete_reply_to_marker_test');
const NumCommentsMessageTest = require('./num_comments_message_test');
*/
const AdminCanDeleteTest = require('./admin_can_delete_test');

class DeletePostRequestTester {

	deletePostTest () {
		new DeletePostTest().test();
		new DeletePostFetchTest().test();
		new ACLTest().test();
		new ACLTeamTest().test();
		new PostNotFoundTest().test();
		new AlreadyDeletedTest().test();
		new MessageTest({ streamType: 'channel' }).test();
		new MessageTest({ streamType: 'direct' }).test();
		//new MessageTest({ streamType: 'file' }).test();
		//new MarkerDeletedTest().test();
		//new MarkersDeletedMessageTest().test();
		//new DeleteReplyToMarkerTest().test();
		//new NumCommentsMessageTest().test();
		new AdminCanDeleteTest().test();
	}
}

module.exports = DeletePostRequestTester;
