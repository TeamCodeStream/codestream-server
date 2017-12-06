'use strict';

const PostAttributes = require(process.env.CS_API_TOP + '/services/api/modules/posts/post_attributes');
const StreamAttributes = require(process.env.CS_API_TOP + '/services/api/modules/streams/stream_attributes');
const MarkerAttributes = require(process.env.CS_API_TOP + '/services/api/modules/markers/marker_attributes');

const EXPECTED_POST_FIELDS = [
	'_id',
	'deactivated',
	'createdAt',
	'modifiedAt',
	'creatorId',
	'teamId',
	'streamId',
	'text',
	'seqNum'
];

const EXPECTED_FILE_POST_FIELDS = [
	'repoId',
	'commitHashWhenPosted',
	'codeBlocks'
];

const EXPECTED_REPLY_POST_FIELDS = [
	'parentPostId'
];

const UNSANITIZED_ATTRIBUTES = Object.keys(PostAttributes).filter(attribute => {
	return PostAttributes[attribute].serverOnly;
});

const UNSANITIZED_STREAM_ATTRIBUTES = Object.keys(StreamAttributes).filter(attribute => {
	return StreamAttributes[attribute].serverOnly;
});

const UNSANITIZED_MARKER_ATTRIBUTES = Object.keys(MarkerAttributes).filter(attribute => {
	return MarkerAttributes[attribute].serverOnly;
});

module.exports = {
	EXPECTED_POST_FIELDS,
	EXPECTED_FILE_POST_FIELDS,
	EXPECTED_REPLY_POST_FIELDS,
	UNSANITIZED_ATTRIBUTES,
	UNSANITIZED_STREAM_ATTRIBUTES,
	UNSANITIZED_MARKER_ATTRIBUTES
};
