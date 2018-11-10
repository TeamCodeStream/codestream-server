// handle unit tests for the "PUT /codemarks" request to update a knowledge base codemark

'use strict';

const PutCodemarkTest = require('./put_codemark_test');
const SetPostIdTest = require('./set_post_id_test');
const ACLTest = require('./acl_test');
const ACLTeamTest = require('./acl_team_test');
const CodemarkNotFoundTest = require('./codemark_not_found_test');
const PutCodemarkFetchTest = require('./put_codemark_fetch_test');
const NoUpdateOtherAttributeTest = require('./no_update_other_attribute_test');
const NoUpdatePostIdTest = require('./no_update_post_id_test');
const NoStreamIdTest = require('./no_stream_id_test');
const MessageTest = require('./message_test');
const ProviderTypeMessageTest = require('./provider_type_message_test');

class PutCodemarkRequestTester {

	test () {
		new PutCodemarkTest().test();
		new SetPostIdTest().test();
		new ACLTest().test();
		new ACLTeamTest().test();
		new CodemarkNotFoundTest().test();
		new PutCodemarkFetchTest().test();
		new NoUpdateOtherAttributeTest({ attribute: 'type' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'markerIds' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'teamId' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'providerType' }).test();
		new NoUpdatePostIdTest().test();
		new NoStreamIdTest().test();
		new MessageTest({ streamType: 'channel' }).test();
		new MessageTest({ streamType: 'direct' }).test();
		new MessageTest({ streamType: 'team stream' }).test();
		new ProviderTypeMessageTest({ streamType: 'channel' }).test();
		new ProviderTypeMessageTest({ streamType: 'direct' }).test();
		new ProviderTypeMessageTest({ streamType: 'team stream' }).test();
	}
}

module.exports = new PutCodemarkRequestTester();
