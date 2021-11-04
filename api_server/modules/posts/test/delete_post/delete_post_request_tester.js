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
const DeleteRelationsTest = require('./delete_relations_test');
const DeleteReviewTest = require('./delete_review_test');
const DeleteReviewFetchTest = require('./delete_review_fetch_test');
const ReviewMessageTest = require('./review_message_test');
const NumRepliesReviewTest = require('./num_replies_review_test');
const DeleteReviewMarkersTest = require('./delete_review_markers_test');
const DeleteReviewMarkersFetchTest = require('./delete_review_markers_fetch_test');
const ReviewMarkersMessageTest = require('./review_markers_message_test');
const DeleteReviewRepliesTest = require('./delete_review_replies_test');
const DeleteReplyToCodemarkTest = require('./delete_reply_to_codemark_test');
const DeleteReplyToReviewTest = require('./delete_reply_to_review_test');
const DeleteReplyToCodeErrorTest = require('./delete_reply_to_code_error_test');
const DeleteCodemarkReplyToReviewTest = require('./delete_codemark_reply_to_review_test');
const DeleteCodemarkReplyToCodeErrorTest = require('./delete_codemark_reply_to_code_error_test');

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
		new MessageTest().test();
		new CodemarkMessageTest().test();
		new MarkerMessageTest().test();
		new ReviewMessageTest().test();
		new ReviewMarkersMessageTest().test();
		// NOTE - posting to any stream other than the team stream is no longer allowed
		//new MessageTest({ streamType: 'channel' }).test();
		//new MessageTest({ streamType: 'direct' }).test();
		//new MessageTest({ streamType: 'team stream' }).test();
		//new CodemarkMessageTest({ streamType: 'channel' }).test();
		//new CodemarkMessageTest({ streamType: 'direct' }).test();
		//new CodemarkMessageTest({ streamType: 'team stream' }).test();
		//new MarkerMessageTest({ streamType: 'channel' }).test();
		//new MarkerMessageTest({ streamType: 'direct' }).test();
		//new ReviewMessageTest({ streamType: 'channel' }).test();
		//new ReviewMessageTest({ streamType: 'direct' }).test();
		//new ReviewMessageTest({ streamType: 'team stream' }).test();
		//new ReviewMarkersMessageTest({ streamType: 'channel'}).test();
		//new ReviewMarkersMessageTest({ streamType: 'direct'}).test();
		new DeleteRelationsTest().test();
		new DeleteReviewTest().test();
		new DeleteReviewFetchTest().test();
		new NumRepliesReviewTest().test();
		new DeleteReviewMarkersTest().test();
		new DeleteReviewMarkersFetchTest().test();
		new DeleteReviewRepliesTest().test();
		new DeleteReplyToCodemarkTest().test();
		new DeleteReplyToReviewTest().test();
		new DeleteReplyToCodeErrorTest().test();
		new DeleteCodemarkReplyToReviewTest().test();
		new DeleteCodemarkReplyToCodeErrorTest().test();
	}
}

module.exports = DeletePostRequestTester;
