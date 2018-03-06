// handle unit tests for the "PUT /slack-enable" request, to enable (or disable)
// slack integration for a given team

'use strict';

const SlackEnableTest = require('./slack_enable_test');
const SlackEnableFetchTest = require('./slack_enable_fetch_test');
//const ACLTest = require('./acl_test');
//const IncorrectSecretTest = require('./incorrect_secret_test');
const MissingParameterTest = require('./missing_parameter_test');
const EnableThenDisableTest = require('./enable_then_disable_test');
const MessageToTeamTest = require('./message_to_team_test');

/* jshint -W071 */

class SlackEnableRequestTester {

	test () {
		new SlackEnableTest().test();
		new SlackEnableFetchTest().test();
//		new ACLTest().test();
//		new IncorrectSecretTest().test();
		new MissingParameterTest({ parameter: 'teamId' }).test();
		new MissingParameterTest({ parameter: 'enable' }).test();
		new EnableThenDisableTest().test();
		new MessageToTeamTest().test();
	}
}

/* jshint +W071 */

module.exports = new SlackEnableRequestTester();
