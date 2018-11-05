// test constants for testing the posts module

'use strict';

const PostAttributes = require(process.env.CS_API_TOP + '/modules/posts/post_attributes');
const StreamAttributes = require(process.env.CS_API_TOP + '/modules/streams/stream_attributes');
const MarkerAttributes = require(process.env.CS_API_TOP + '/modules/markers/marker_attributes');
const CodeMarkAttributes = require(process.env.CS_API_TOP + '/modules/codemarks/codemark_attributes');

// fields expected in all posts
const EXPECTED_POST_FIELDS = [
	'_id',
	'deactivated',
	'createdAt',
	'modifiedAt',
	'creatorId',
	'teamId',
	'streamId',
	'text',
	'seqNum',
	'origin',
	'numReplies'
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

const UNSANITIZED_CODEMARK_ATTRIBUTES = Object.keys(CodeMarkAttributes).filter(attribute => {
	return CodeMarkAttributes[attribute].serverOnly;
});

module.exports = {
	EXPECTED_POST_FIELDS,
	UNSANITIZED_ATTRIBUTES,
	UNSANITIZED_STREAM_ATTRIBUTES,
	UNSANITIZED_MARKER_ATTRIBUTES,
	UNSANITIZED_CODEMARK_ATTRIBUTES
};
