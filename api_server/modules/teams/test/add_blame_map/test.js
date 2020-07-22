// handle unit tests for the "POST /add-blamp-map/:teamId" request to add a new blame-map to a team's settings

'use strict';

const AddBlameMapTest = require('./add_blame_map_test');
const FetchTest = require('./fetch_test');
const MessageTest = require('./message_test');
const TeamNotFoundTest = require('./team_not_found_test');
const UserNotFoundTest = require('./user_not_found_test');
const ACLTest = require('./acl_test');
const ParameterRequiredTest = require('./parameter_required_test');
const UserNotOnTeamTest = require('./user_not_on_team_test');
const UpdateBlameMapTest = require('./update_blame_map_test');

class AddBlameMapRequestTester {

	test () {
		new AddBlameMapTest().test();
		new FetchTest().test();
		new MessageTest().test();
		new TeamNotFoundTest().test();
		new UserNotFoundTest().test();
		new ACLTest().test();
		new ParameterRequiredTest({ parameter: 'email' }).test();
		new ParameterRequiredTest({ parameter: 'userId' }).test();
		new UserNotOnTeamTest().test();
		new UpdateBlameMapTest().test();
	}
}

module.exports = new AddBlameMapRequestTester();
