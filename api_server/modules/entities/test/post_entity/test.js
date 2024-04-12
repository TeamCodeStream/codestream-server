// handle unit tests for the "POST /entities" request,
// to create a New Relic entity

'use strict';

const PostEntityTest = require('./post_entity_test');
const ParameterRequiredTest = require('./parameter_required_test');
const InvalidParameterTest = require('./invalid_parameter_test');
const ACLTest = require('./acl_test');
const DeactivatedTeamTest = require('./deactivated_team_test');
const FetchTest = require('./fetch_test');
const EntityExistsTest = require('./entity_exists_test');
const EntityExistsOtherUserTest = require('./entity_exists_other_user_test');
const EntityExistsOtherTeamTest = require('./entity_exists_other_team_test');

class PostEntityRequestTester {

	test () {
		new PostEntityTest().test();
		new ParameterRequiredTest({ parameter: 'teamId' }).test();
		new ParameterRequiredTest({ parameter: 'entityId' }).test();
		new InvalidParameterTest({ parameter: 'teamId' }).test();
		new InvalidParameterTest({ parameter: 'entityId' }).test();
		new ACLTest().test();
		new DeactivatedTeamTest().test();
		new FetchTest().test();
		new EntityExistsTest().test();
		new EntityExistsOtherUserTest().test();
		new EntityExistsOtherTeamTest().test();
	}
}

module.exports = new PostEntityRequestTester();
