// test constants for testing the codemarks module

'use strict';

const CodemarkAttributes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/codemarks/codemark_attributes');
const StreamAttributes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/streams/stream_attributes');
const RepoAttributes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/repos/repo_attributes');
const MarkerAttributes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/markers/marker_attributes');
const PostAttributes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/post_attributes');

const EXPECTED_BASE_CODEMARK_FIELDS = [
	'_id',
	'deactivated',
	'createdAt',
	'modifiedAt',
	'creatorId',
	'teamId',
	'streamId',
	'postId',
	'type',
	'status',
	'numReplies',
	'permalink',
	'lastActivityAt'
];

const EXPECTED_CODEMARK_FIELDS = EXPECTED_BASE_CODEMARK_FIELDS.concat([
	'title',
	'text'
]);

const EXPECTED_INVISIBLE_CODEMARK_FIELDS = EXPECTED_BASE_CODEMARK_FIELDS.concat([
	'invisible'
]);

const UNSANITIZED_ATTRIBUTES = Object.keys(CodemarkAttributes).filter(attribute => {
	return CodemarkAttributes[attribute].serverOnly;
});

const UNSANITIZED_STREAM_ATTRIBUTES = Object.keys(StreamAttributes).filter(attribute => {
	return StreamAttributes[attribute].serverOnly;
});

const UNSANITIZED_REPO_ATTRIBUTES = Object.keys(RepoAttributes).filter(attribute => {
	return RepoAttributes[attribute].serverOnly;
});

const UNSANITIZED_MARKER_ATTRIBUTES = Object.keys(MarkerAttributes).filter(attribute => {
	return MarkerAttributes[attribute].serverOnly;
});

const UNSANITIZED_POST_ATTRIBUTES = Object.keys(PostAttributes).filter(attribute => {
	return PostAttributes[attribute].serverOnly;
});

module.exports = {
	EXPECTED_BASE_CODEMARK_FIELDS,
	EXPECTED_CODEMARK_FIELDS,
	EXPECTED_INVISIBLE_CODEMARK_FIELDS,	
	UNSANITIZED_ATTRIBUTES,
	UNSANITIZED_STREAM_ATTRIBUTES,
	UNSANITIZED_REPO_ATTRIBUTES,
	UNSANITIZED_MARKER_ATTRIBUTES,
	UNSANITIZED_POST_ATTRIBUTES
};
