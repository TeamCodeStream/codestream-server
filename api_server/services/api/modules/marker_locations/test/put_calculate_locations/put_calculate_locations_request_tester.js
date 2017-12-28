// handle unit tests associated with the "PUT /calculate-locations" request

'use strict';

var PutCalculateLocationsTest = require('./put_calculate_locations_test');
var PutCalculateLocationsFetchTest = require('./put_calculate_locations_fetch_test');
var NoAttributeTest = require('./no_attribute_test');
var BadTypeTest = require('./bad_type_test');
var BadEditTest = require('./bad_edit_test');
var MissingEditElementTest = require('./missing_edit_element_test');
var StreamNotFoundTest = require('./stream_not_found_test');
var ACLStreamTest = require('./acl_stream_test');
var ACLTeamTest = require('./acl_team_test');
var NonFileStreamTest = require('./non_file_stream_test');
var OtherTeamTest = require('./other_team_test');
var MessageToTeamTest = require('./message_to_team_test');
var ClientSendsLocationsTest = require('./client_sends_locations_test');

/* jshint -W071 */

class PutCalculateLocationsRequestTester {

	putCalculateLocationsTest () {
		new PutCalculateLocationsTest().test();
		new PutCalculateLocationsFetchTest().test();
		new NoAttributeTest({ attribute: 'teamId' }).test();
		new NoAttributeTest({ attribute: 'streamId' }).test();
		new NoAttributeTest({ attribute: 'originalCommitHash' }).test();
		new NoAttributeTest({ attribute: 'newCommitHash' }).test();
		new NoAttributeTest({ attribute: 'edits' }).test();
		new BadTypeTest({ attribute: 'teamId' }).test();
		new BadTypeTest({ attribute: 'streamId' }).test();
		new BadTypeTest({ attribute: 'originalCommitHash' }).test();
		new BadTypeTest({ attribute: 'newCommitHash' }).test();
		new BadTypeTest({ attribute: 'edits' }).test();
		new BadEditTest().test();
		new MissingEditElementTest().test();
		new StreamNotFoundTest().test();
		new ACLStreamTest().test();
		new ACLTeamTest().test();
		new NonFileStreamTest({ streamType: 'channel' }).test();
		new NonFileStreamTest({ streamType: 'direct' }).test();
		new OtherTeamTest().test();
		new MessageToTeamTest().test();
		new ClientSendsLocationsTest().test();
	}
}

/* jshint +W071 */

module.exports = PutCalculateLocationsRequestTester;
