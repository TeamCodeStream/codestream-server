// test constants for testing the reviews module

'use strict';

const ReviewAttributes = require(process.env.CS_API_TOP + '/modules/reviews/review_attributes');

const EXPECTED_BASE_REVIEW_FIELDS = [
	'_id',
	'deactivated',
	'createdAt',
	'modifiedAt',
	'creatorId',
	'teamId',
	'streamId',
	'postId',
	'status',
	'numReplies',
	'lastActivityAt',
	'title'
];

const EXPECTED_REVIEW_FIELDS = EXPECTED_BASE_REVIEW_FIELDS.concat([
	'text',
]);

const UNSANITIZED_ATTRIBUTES = Object.keys(ReviewAttributes).filter(attribute => {
	return ReviewAttributes[attribute].serverOnly;
});

// these should not be served with review objects, must be obtained separately
UNSANITIZED_ATTRIBUTES.push('reviewDiffs'); 
UNSANITIZED_ATTRIBUTES.push('checkpointReviewDiffs'); 

module.exports = {
	EXPECTED_BASE_REVIEW_FIELDS,
	EXPECTED_REVIEW_FIELDS,
	UNSANITIZED_ATTRIBUTES
};
