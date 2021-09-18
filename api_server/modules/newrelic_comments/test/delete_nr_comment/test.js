// handle unit tests for the "DELETE /markers/:id" request,
// to delete a marker

'use strict';

const DeleteTest = require('./delete_marker_test');
const MessageTest = require('./message_test');
const MarkerNotFoundTest = require('./marker_not_found_test');
const AlreadyDeletedTest = require('./already_deleted_test');
const ACLTest = require('./acl_test');
const ACLCreatorTest = require('./acl_creator_test');
const AdminCanDeleteTest = require('./admin_can_delete_test');
const FetchCodemarkTest = require('./fetch_codemark_test');

class DeleteMarkerRequestTester {

	test () {
		new DeleteTest().test();
		new MessageTest().test();
		new MarkerNotFoundTest().test();
		new AlreadyDeletedTest().test();
		new ACLTest().test();
		new ACLCreatorTest().test();
		new AdminCanDeleteTest().test();
		new FetchCodemarkTest().test();
	}
}

module.exports = new DeleteMarkerRequestTester();
