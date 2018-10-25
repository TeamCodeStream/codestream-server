// handle unit tests for the "PUT /markers" request

'use strict';

const PutMarkerTest = require('./put_marker_test');
const ACLTest = require('./acl_test');
const MarkerNotFoundTest = require('./marker_not_found_test');
const MessageToTeamTest = require('./message_to_team_test');
const MessageToStreamTest = require('./message_to_stream_test');
const NoUpdateOtherAttributeTest = require('./no_update_other_attribute_test');
const SetPostIdTest = require('./set_post_id_test');
const MarkerAlreadyHasPostIdTest = require('./marker_already_has_post_id_test');
const NoAttributeTest = require('./no_attribute_test');

class PutMarkerRequestTester {

	putMarkerTest () {
		new PutMarkerTest().test();
		new ACLTest().test();
		new MarkerNotFoundTest().test();
		new MessageToTeamTest().test();
		new MessageToStreamTest({ streamType: 'channel' }).test();
		new MessageToStreamTest({ streamType: 'direct' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'teamId' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'streamId' }).test();
		new SetPostIdTest().test();
		new MarkerAlreadyHasPostIdTest().test();
		new NoAttributeTest({ attribute: 'postStreamId' }).test();
		new NoAttributeTest({ attribute: 'providerType' }).test();
	}
}

module.exports = PutMarkerRequestTester;
