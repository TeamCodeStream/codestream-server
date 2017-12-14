'use strict';

const MarkerAttributes = require(process.env.CS_API_TOP + '/services/api/modules/markers/marker_attributes');
const MarkerLocationsAttributes = require(process.env.CS_API_TOP + '/services/api/modules/marker_locations/marker_locations_attributes');

const EXPECTED_MARKER_FIELDS = [
	'_id',
	'deactivated',
	'teamId',
	'streamId',
	'postId',
	'numComments'
];

const UNSANITIZED_ATTRIBUTES = Object.keys(MarkerAttributes).filter(attribute => {
	return MarkerAttributes[attribute].serverOnly;
});

const UNSANITIZED_MARKER_LOCATIONS_ATTRIBUTES = Object.keys(MarkerLocationsAttributes).filter(attribute => {
	return MarkerLocationsAttributes[attribute].serverOnly;
});

module.exports = {
	EXPECTED_MARKER_FIELDS,
	UNSANITIZED_ATTRIBUTES,
	UNSANITIZED_MARKER_LOCATIONS_ATTRIBUTES
};
