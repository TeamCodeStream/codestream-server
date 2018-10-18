// handle unit tests associated with the "PUT /marker-locations" request

'use strict';

const PutMarkerLocationsTest = require('./put_marker_locations_test');
const PutMarkerLocationsFetchTest = require('./put_marker_locations_fetch_test');
const NoAttributeTest = require('./no_attribute_test');
const BadTypeTest = require('./bad_type_test');
const BadTypeLocationTest = require('./bad_type_location_test');
const LocationsTooLargeTest = require('./locations_too_large_test');
const StreamNotFoundTest = require('./stream_not_found_test');
const ACLStreamTest = require('./acl_stream_test');
const ACLTeamTest = require('./acl_team_test');
const NonFileStreamTest = require('./non_file_stream_test');
const OtherTeamTest = require('./other_team_test');
const BadMarkerIdTest = require('./bad_marker_id_test');
const BadLocationTest = require('./bad_location_test');
const LocationTooLongTest = require('./location_too_long_test');
const LocationTooShortTest = require('./location_too_short_test');
const BadLocationCoordinateTest = require('./bad_location_coordinate_test');
const InvalidCoordinateObjectTest = require('./invalid_coordinate_object_test');
const AdditionalMarkerLocationsTest = require('./additional_marker_locations_test');
const MessageToTeamTest = require('./message_to_team_test');

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
