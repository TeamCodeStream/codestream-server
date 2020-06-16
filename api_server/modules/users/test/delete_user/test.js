// handle unit tests for the "DELETE /users/:id" request, for deactivating users
 
'use strict';

const DeleteUserTest = require('./delete_user_test');
const DeleteUserFetchTest = require('./delete_user_fetch_test');
const MessageTest = require('./message_test');
const ACLTest = require('./acl_test');
const UserNotFoundTest = require('./user_not_found_test');
const DeleteSelfTest = require('./delete_self_test');
const NonAdminCantDeleteTest = require('./non_admin_cant_delete_test');
const AlreadyDeletedTest = require('./already_deleted_test');

class DeleteUserRequestTester {

	test () {
		new DeleteUserTest().test();
		new DeleteUserFetchTest().test();
		new MessageTest().test();
		new ACLTest().test();
		new UserNotFoundTest().test();
		new DeleteSelfTest().test();
		new NonAdminCantDeleteTest().test();
		new AlreadyDeletedTest().test();
	}
}

module.exports = new DeleteUserRequestTester();
