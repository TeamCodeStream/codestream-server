// handle unit tests for the "PUT /unpin/:id" request to unpin a codemark

'use strict';

const UnpinTest = require('./unpin_test');
const ACLTest = require('./acl_test');
const CodemarkNotFoundTest = require('./codemark_not_found_test');
const UnpinFetchTest = require('./unpin_fetch_test');
const MessageTest = require('./message_test');
const ProviderTypeMessageTest = require('./provider_type_message_test');

class UnpinRequestTester {

	test () {
		new UnpinTest().test();
		new ACLTest().test();
		new CodemarkNotFoundTest().test();
		new UnpinFetchTest().test();
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
