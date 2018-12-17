// handle unit tests for the "PUT /pin-post" request to pin a reply post to a codemark

'use strict';

const PinPostTest = require('./pin_post_test');
const ACLTest = require('./acl_test');
const ACLTeamTest = require('./acl_team_test');
const ParameterRequiredTest = require('./parameter_required_test');
const CodemarkNotFoundTest = require('./codemark_not_found_test');
const PostNotFoundTest = require('./post_not_found_test');
const PostNotReplyTest = require('./post_not_reply_test');
const PostNotReplyToCodemarkTest = require('./post_not_reply_to_codemark_test');
const PinPostFetchTest = require('./pin_post_fetch_test');
const MessageTest = require('./message_test');
const ProviderTypeMessageTest = require('./provider_type_message_test');

class PinRequestTester {

	test () {
		new PinPostTest().test();
		new ACLTest({ streamType: 'channel' }).test();
		new ACLTest({ streamType: 'direct' }).test();
		new ACLTeamTest().test();
		new ParameterRequiredTest({ parameter: 'codemarkId' }).test();
		new ParameterRequiredTest({ parameter: 'postId' }).test();
		new CodemarkNotFoundTest().test();
		new PostNotFoundTest().test();
		new PostNotReplyTest().test();
		new PostNotReplyToCodemarkTest().test();
		new PinPostFetchTest().test();
		new MessageTest({ streamType: 'channel' }).test();
		new MessageTest({ streamType: 'direct' }).test();
		new MessageTest({ streamType: 'team stream' }).test();
		new ProviderTypeMessageTest({ streamType: 'channel' }).test();
		new ProviderTypeMessageTest({ streamType: 'direct' }).test();
		new ProviderTypeMessageTest({ streamType: 'team stream' }).test();
	}
}

module.exports = new PinRequestTester();
