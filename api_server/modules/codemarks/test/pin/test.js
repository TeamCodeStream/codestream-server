// handle unit tests for the "PUT /pin/:id" request to pin a codemark

'use strict';

const PinTest = require('./pin_test');
const ACLTest = require('./acl_test');
const CodemarkNotFoundTest = require('./codemark_not_found_test');
const PinFetchTest = require('./pin_fetch_test');
const MessageTest = require('./message_test');
const ProviderTypeMessageTest = require('./provider_type_message_test');

class PinRequestTester {

	test () {
		new PinTest().test();
		new ACLTest().test();
		new CodemarkNotFoundTest().test();
		new PinFetchTest().test();
		new MessageTest({ streamType: 'channel' }).test();
		new MessageTest({ streamType: 'direct' }).test();
		new MessageTest({ streamType: 'team stream' }).test();
		new ProviderTypeMessageTest({ streamType: 'channel' }).test();
		new ProviderTypeMessageTest({ streamType: 'direct' }).test();
		new ProviderTypeMessageTest({ streamType: 'team stream' }).test();
	}
}

module.exports = new PinRequestTester();
