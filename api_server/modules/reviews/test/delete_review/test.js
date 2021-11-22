// handle unit tests for the "DELETE /reviews/:id" request to delete a code review

'use strict';

const DeleteReviewTest = require('./delete_review_test');
const DeleteReviewFetchTest = require('./delete_review_fetch_test');
const DeleteMarkersTest = require('./delete_markers_test');
const DeleteMarkersFetchTest = require('./delete_markers_fetch_test');
//const ACLTest = require('./acl_test');
const ACLTeamTest = require('./acl_team_test');
const ReviewNotFoundTest = require('./review_not_found_test');
const AlreadyDeletedTest = require('./already_deleted_test');
const AdminCanDeleteTest = require('./admin_can_delete_test');
const MessageTest = require('./message_test');
const MarkersToTeamMessageTest = require('./markers_to_team_message_test');
const DeleteRepliesTest = require('./delete_replies_test');
const DeleteRelationsTest = require('./delete_relations_test');
const RemovedMemberCantDeleteTest = require('./removed_member_cant_delete_test');

class DeleteReviewRequestTester {

	test () {
		new DeleteReviewTest().test();
		new DeleteReviewFetchTest().test();
		new DeleteMarkersTest().test();
		new DeleteMarkersFetchTest().test();
		//new ACLTest().test();
		new ACLTeamTest().test();
		new ReviewNotFoundTest().test();
		new AlreadyDeletedTest().test();
		new AdminCanDeleteTest().test();
		new MessageTest().test();
		new MarkersToTeamMessageTest().test();
		// NOTE - posting to streams other than the team stream is no longer allowed
		//new MessageTest({ streamType: 'channel' }).test();
		//new MessageTest({ streamType: 'direct' }).test();
		//new MessageTest({ streamType: 'team stream' }).test();
		//new MarkersToTeamMessageTest({ streamType: 'channel' }).test();
		//new MarkersToTeamMessageTest({ streamType: 'direct' }).test();
		//new MarkersToTeamMessageTest({ streamType: 'team stream' }).test();
		new DeleteRepliesTest().test();
		new DeleteRelationsTest().test();
		new RemovedMemberCantDeleteTest().test();
	}
}

module.exports = new DeleteReviewRequestTester();
