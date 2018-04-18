// handle unit tests for the "PUT /teams-enable" request, to enable (or disable)
// MS Teams integration for a given team

'use strict';

const TeamsEnableTest = require('./teams_enable_test');
const TeamsEnableFetchTest = require('./teams_enable_fetch_test');
const ACLTest = require('./acl_test');
const IncorrectSecretTest = require('./incorrect_secret_test');
const MissingParameterTest = require('./missing_parameter_test');
const EnableThenDisableTest = require('./enable_then_disable_test');
const MessageToTeamTest = require('./message_to_team_test');

class TeamsEnableRequestTester {

	test () {
		new TeamsEnableTest().test();
		new TeamsEnableFetchTest().test();
		new ACLTest().test();
		new IncorrectSecretTest().test();
		new MissingParameterTest({ parameter: 'teamId' }).test();
		new MissingParameterTest({ parameter: 'enable' }).test();
		new EnableThenDisableTest().test();
		new MessageToTeamTest().test();
	}
}

module.exports = new TeamsEnableRequestTester();
