// handle unit tests for the "PUT /posts" request

'use strict';

const DeletePostTest = require('./delete_post_test');
const ACLTest = require('./acl_test');
const ACLTeamTest = require('./acl_team_test');
const PostNotFoundTest = require('./post_not_found_test');
const AlreadyDeletedTest = require('./already_deleted_test');
const MessageToTeamTest = require('./message_to_team_test');
const MessageToStreamTest = require('./message_to_stream_test');
const MarkerDeletedTest = require('./marker_deleted_test');
const MultipleMarkersDeletedTest = require('./multiple_markers_deleted_test');
const MarkersDeletedMessageTest = require('./markers_deleted_message_test');
const DeleteReplyToCodeBlockTest = require('./delete_reply_to_code_block_test');
const NumCommentsMessageTest = require('./num_comments_message_test');
const AdminCanDeleteTest = require('./admin_can_delete_test');

class DeletePostRequestTester {

	deletePostTest () {
		new DeletePostTest().test();
		new ACLTest().test();
		new ACLTeamTest().test();
		new PostNotFoundTest().test();
		new AlreadyDeletedTest().test();
		new MessageToTeamTest().test();
		new MessageToStreamTest({ streamType: 'channel' }).test();
		new MessageToStreamTest({ streamType: 'direct' }).test();
		new MarkerDeletedTest().test();
		new MultipleMarkersDeletedTest().test();
		new MarkersDeletedMessageTest().test();
		new DeleteReplyToCodeBlockTest().test();
		new NumCommentsMessageTest().test();
		new AdminCanDeleteTest().test();
	}
}

module.exports = DeletePostRequestTester;
