// handle unit tests for the "PUT /unpin-post" request to unpin a reply post from a codemark

'use strict';

const UnpinPostTest = require('./unpin_post_test');
//const ACLTest = require('./acl_test');
const ACLTeamTest = require('./acl_team_test');
const ParameterRequiredTest = require('./parameter_required_test');
const CodemarkNotFoundTest = require('./codemark_not_found_test');
const UnpinPostFetchTest = require('./unpin_post_fetch_test');
const MessageTest = require('./message_test');
const ProviderTypeMessageTest = require('./provider_type_message_test');

class UnpinRequestTester {

	test () {
		new UnpinPostTest().test();
		//new ACLTest({ streamType: 'channel' }).test();
		//new ACLTest({ streamType: 'direct' }).test();
		new ACLTeamTest().test();
		new ParameterRequiredTest({ parameter: 'codemarkId' }).test();
		new ParameterRequiredTest({ parameter: 'postId' }).test();
		new CodemarkNotFoundTest().test();
		new UnpinPostFetchTest().test();
		new MessageTest().test();
		new ProviderTypeMessageTest().test();
		// NOTE posting to streams other than the team stream is no longer allowed
		//new MessageTest({ streamType: 'channel' }).test();
		//new MessageTest({ streamType: 'direct' }).test();
		//new MessageTest({ streamType: 'team stream' }).test();
		//new ProviderTypeMessageTest({ streamType: 'channel' }).test();
		//new ProviderTypeMessageTest({ streamType: 'direct' }).test();
		//new ProviderTypeMessageTest({ streamType: 'team stream' }).test();
	}
}

module.exports = new UnpinRequestTester();
