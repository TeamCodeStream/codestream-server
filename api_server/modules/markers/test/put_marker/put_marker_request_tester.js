// handle unit tests for the "PUT /markers" request

'use strict';

var PutMarkerTest = require('./put_marker_test');
var ACLTest = require('./acl_test');
var MarkerNotFoundTest = require('./marker_not_found_test');
var MessageToTeamTest = require('./message_to_team_test');
var MessageToStreamTest = require('./message_to_stream_test');
var NoUpdateOtherAttributeTest = require('./no_update_other_attribute_test');

class PutMarkerRequestTester {

	putMarkerTest () {
		new PutMarkerTest().test();
		new ACLTest().test();
		new MarkerNotFoundTest().test();
		new MessageToTeamTest().test();
		new MessageToStreamTest({ fromOtherStreamType: 'channel' }).test();
		new MessageToStreamTest({ fromOtherStreamType: 'direct' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'teamId' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'streamId' }).test();
		new NoUpdateOtherAttributeTest({ attribute: 'postId' }).test();
	}
}

module.exports = PutMarkerRequestTester;
