// handle unit tests for the "POST /add-blamp-map/:teamId" request to add a new blame-map to a team's settings

'use strict';

const DeleteBlameMapTest = require('./delete_blame_map_test');
const FetchTest = require('./fetch_test');
const MessageTest = require('./message_test');
const TeamNotFoundTest = require('./team_not_found_test');
const ACLTest = require('./acl_test');
const ParameterRequiredTest = require('./parameter_required_test');

class DeleteBlameMapRequestTester {

	test () {
		new DeleteBlameMapTest().test();
		new FetchTest().test();
		new MessageTest().test();
		new TeamNotFoundTest().test();
		new ACLTest().test();
		new ParameterRequiredTest({ parameter: 'email' }).test();
	}
}

module.exports = new DeleteBlameMapRequestTester();
