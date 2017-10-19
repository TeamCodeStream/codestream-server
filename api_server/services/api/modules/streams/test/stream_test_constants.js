'use strict';

const Stream_Attributes = require(process.env.CS_API_TOP + '/services/api/modules/streams/stream_attributes');

const EXPECTED_STREAM_FIELDS = [
	'_id',
	'deactivated',
	'created_at',
	'modified_at',
	'creator_id',
	'team_id',
	'type'
];

const EXPECTED_CHANNEL_STREAM_FIELDS = [
	'name',
	'member_ids'
];

const EXPECTED_DIRECT_STREAM_FIELDS = [
	'member_ids'
];

const EXPECTED_FILE_STREAM_FIELDS = [
	'repo_id'
];

const EXPECTED_STREAM_RESPONSE = {
	stream: EXPECTED_STREAM_FIELDS
};

const UNSANITIZED_ATTRIBUTES = Object.keys(Stream_Attributes).filter(attribute => {
	return Stream_Attributes[attribute].server_only;
});

module.exports = {
	EXPECTED_STREAM_FIELDS,
	EXPECTED_CHANNEL_STREAM_FIELDS,
	EXPECTED_DIRECT_STREAM_FIELDS,
	EXPECTED_FILE_STREAM_FIELDS,
	EXPECTED_STREAM_RESPONSE,
	UNSANITIZED_ATTRIBUTES
};
