// handle unit tests for the "DELETE /code-errors/:id" request to delete a code error

'use strict';

const DeleteCodeErrorTest = require('./delete_code_error_test');
const DeleteCodeErrorFetchTest = require('./delete_code_error_fetch_test');
const ACLTest = require('./acl_test');
const CodeErrorNotFoundTest = require('./code_error_not_found_test');
const AlreadyDeletedTest = require('./already_deleted_test');
const AdminCanDeleteTest = require('./admin_can_delete_test');
const MessageTest = require('./message_test');
const DeleteRepliesTest = require('./delete_replies_test');

class DeleteCodeErrorRequestTester {

	test () {
		new DeleteCodeErrorTest().test();
		new DeleteCodeErrorFetchTest().test();
		//new ACLTest().test();
		new CodeErrorNotFoundTest().test();
		new AlreadyDeletedTest().test();
		new AdminCanDeleteTest().test();
		//new MessageTest().test();
		new DeleteRepliesTest().test();
	}
}

module.exports = new DeleteCodeErrorRequestTester();
