// handle unit tests for the "PUT /posts" request

'use strict';

var DeletePostTest = require('./delete_post_test');
var ACLTest = require('./acl_test');
var ACLTeamTest = require('./acl_team_test');
var PostNotFoundTest = require('./post_not_found_test');
var AlreadyDeletedTest = require('./already_deleted_test');
var MessageToTeamTest = require('./message_to_team_test');
var MessageToStreamTest = require('./message_to_stream_test');
var MarkerDeletedTest = require('./marker_deleted_test');
var MultipleMarkersDeletedTest = require('./multiple_markers_deleted_test');
var MarkersDeletedMessageTest = require('./markers_deleted_message_test');
var DeleteReplyToCodeBlockTest = require('./delete_reply_to_code_block_test');
var NumCommentsMessageTest = require('./num_comments_message_test');

/* jshint -W071 */

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
	}
}

/* jshint +W071 */

module.exports = DeletePostRequestTester;
