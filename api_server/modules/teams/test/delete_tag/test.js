// handle unit tests for the "DELETE /team-tags/:teamId/:id" request to delete a tag for a team

'use strict';

const DeleteTagTest = require('./delete_tag_test');
const DeleteDefaultTagTest = require('./delete_default_tag_test');
const FetchTest = require('./fetch_test');
const FetchDefaultTagDeletedTest = require('./fetch_default_tag_deleted_test');
const MessageTest = require('./message_test');
const TeamNotFoundTest = require('./team_not_found_test');
const TagNotFoundTest = require('./tag_not_found_test');
const ACLTest = require('./acl_test');

class DeleteTagRequestTester {

	test () {
		new DeleteTagTest().test();
		new DeleteDefaultTagTest().test();
		new FetchTest().test();
		new FetchDefaultTagDeletedTest().test();
		new MessageTest().test();
		new TeamNotFoundTest().test();
		new TagNotFoundTest().test();
		new ACLTest().test();
	}
}

module.exports = new DeleteTagRequestTester();
