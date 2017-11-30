'use strict';

const MarkerAttributes = require(process.env.CS_API_TOP + '/services/api/modules/markers/marker_attributes');

const EXPECTED_MARKER_FIELDS = [
	'_id',
	'deactivated',
	'teamId',
	'streamId',
	'postId',
	'numPosts'
];

const UNSANITIZED_ATTRIBUTES = Object.keys(MarkerAttributes).filter(attribute => {
	return MarkerAttributes[attribute].serverOnly;
});

module.exports = {
	EXPECTED_MARKER_FIELDS,
	UNSANITIZED_ATTRIBUTES
};
