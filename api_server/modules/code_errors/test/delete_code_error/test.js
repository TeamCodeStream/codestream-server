// handle unit tests for the "DELETE /code-errors/:id" request to delete a code error

'use strict';

const DeleteCodeErrorTest = require('./delete_code_error_test');
const DeleteCodeErrorFetchTest = require('./delete_code_error_fetch_test');
const DeleteMarkersTest = require('./delete_markers_test');
const DeleteMarkersFetchTest = require('./delete_markers_fetch_test');
const ACLTeamTest = require('./acl_team_test');
const CodeErrorNotFoundTest = require('./code_error_not_found_test');
const AlreadyDeletedTest = require('./already_deleted_test');
const AdminCanDeleteTest = require('./admin_can_delete_test');
const MessageTest = require('./message_test');
const MarkersToTeamMessageTest = require('./markers_to_team_message_test');
const DeleteRepliesTest = require('./delete_replies_test');

class DeleteCodeErrorRequestTester {

	test () {
		new DeleteCodeErrorTest().test();
		new DeleteCodeErrorFetchTest().test();
		new DeleteMarkersTest().test();
		new DeleteMarkersFetchTest().test();
		new ACLTeamTest().test();
		new CodeErrorNotFoundTest().test();
		new AlreadyDeletedTest().test();
		new AdminCanDeleteTest().test();
		new MessageTest().test();
		new MarkersToTeamMessageTest().test();
		new DeleteRepliesTest().test();
	}
}

module.exports = new DeleteCodeErrorRequestTester();
