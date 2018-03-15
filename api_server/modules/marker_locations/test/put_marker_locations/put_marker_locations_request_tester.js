// handle unit tests associated with the "PUT /marker-locations" request

'use strict';

var PutMarkerLocationsTest = require('./put_marker_locations_test');
var PutMarkerLocationsFetchTest = require('./put_marker_locations_fetch_test');
var NoAttributeTest = require('./no_attribute_test');
var BadTypeTest = require('./bad_type_test');
var BadTypeLocationTest = require('./bad_type_location_test');
var LocationsTooLargeTest = require('./locations_too_large_test');
var StreamNotFoundTest = require('./stream_not_found_test');
var ACLStreamTest = require('./acl_stream_test');
var ACLTeamTest = require('./acl_team_test');
var NonFileStreamTest = require('./non_file_stream_test');
var OtherTeamTest = require('./other_team_test');
var BadMarkerIdTest = require('./bad_marker_id_test');
var BadLocationTest = require('./bad_location_test');
var LocationTooLongTest = require('./location_too_long_test');
var LocationTooShortTest = require('./location_too_short_test');
var BadLocationCoordinateTest = require('./bad_location_coordinate_test');
var InvalidCoordinateObjectTest = require('./invalid_coordinate_object_test');
var AdditionalMarkerLocationsTest = require('./additional_marker_locations_test');
var MessageToTeamTest = require('./message_to_team_test');

class PutMarkerLocationsRequestTester {

	putMarkerLocationsTest () {
		new PutMarkerLocationsTest().test();
		new PutMarkerLocationsFetchTest().test();
		new NoAttributeTest({ attribute: 'teamId' }).test();
		new NoAttributeTest({ attribute: 'streamId' }).test();
		new NoAttributeTest({ attribute: 'commitHash' }).test();
		new NoAttributeTest({ attribute: 'locations' }).test();
		new BadTypeTest({ attribute: 'teamId' }).test();
		new BadTypeTest({ attribute: 'streamId' }).test();
		new BadTypeTest({ attribute: 'commitHash' }).test();
		new BadTypeLocationTest().test();
		new LocationsTooLargeTest().test();
		new StreamNotFoundTest().test();
		new ACLStreamTest().test();
		new ACLTeamTest().test();
		new NonFileStreamTest({ streamType: 'channel' }).test();
		new NonFileStreamTest({ streamType: 'direct' }).test();
		new OtherTeamTest().test();
		new BadMarkerIdTest().test();
		new BadLocationTest().test();
		new LocationTooLongTest().test();
		new LocationTooShortTest().test();
		new BadLocationCoordinateTest().test();
		new InvalidCoordinateObjectTest().test();
		new AdditionalMarkerLocationsTest().test();
		new MessageToTeamTest().test();
	}
}

module.exports = PutMarkerLocationsRequestTester;
