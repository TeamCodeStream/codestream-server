'use strict';

const Post_Attributes = require(process.env.CI_API_TOP + '/services/api/modules/posts/post_attributes');
const Stream_Attributes = require(process.env.CI_API_TOP + '/services/api/modules/streams/stream_attributes');

const EXPECTED_POST_FIELDS = [
	'_id',
	'deactivated',
	'created_at',
	'modified_at',
	'creator_id',
	'company_id',
	'team_id',
	'stream_id',
	'text'
];

const EXPECTED_FILE_POST_FIELDS = [
	'repo_id',
	'commit_sha_when_posted',
	'location',
	'replay_info',
];

const EXPECTED_REPLY_POST_FIELDS = [
	'parent_post_id'
];

const UNSANITIZED_ATTRIBUTES = Object.keys(Post_Attributes).filter(attribute => {
	return Post_Attributes[attribute].server_only;
});

const UNSANITIZED_STREAM_ATTRIBUTES = Object.keys(Stream_Attributes).filter(attribute => {
	return Stream_Attributes[attribute].server_only;
});

module.exports = {
	EXPECTED_POST_FIELDS,
	EXPECTED_FILE_POST_FIELDS,
	EXPECTED_REPLY_POST_FIELDS,
	UNSANITIZED_ATTRIBUTES,
	UNSANITIZED_STREAM_ATTRIBUTES
};
