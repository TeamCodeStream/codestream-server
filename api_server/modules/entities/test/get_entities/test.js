// handle unit tests for the "GET /entities" request

'use strict';

const GetEntitiesTest = require('./get_entities_test');
const TeamIdRequiredTest = require('./team_id_required_test');
const ACLTest = require('./acl_test');

class GetEntitiesRequestTester {

	test () {
		new GetEntitiesTest().test();
		new TeamIdRequiredTest().test();
		new ACLTest().test();
	}
}

module.exports = new GetEntitiesRequestTester();
