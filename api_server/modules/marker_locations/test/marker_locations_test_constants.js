// test constants for testing the marker locations module

'use strict';

const MarkerLocationsAttributes = require(process.env.CS_API_TOP + '/modules/marker_locations/marker_locations_attributes');

const EXPECTED_MARKER_LOCATIONS_FIELDS = [
	'teamId',
	'streamId',
	'postId',
	'locations'
];

const UNSANITIZED_ATTRIBUTES = Object.keys(MarkerLocationsAttributes).filter(attribute => {
	return MarkerLocationsAttributes[attribute].serverOnly;
});

module.exports = {
	EXPECTED_MARKER_LOCATIONS_FIELDS,
	UNSANITIZED_ATTRIBUTES
};
