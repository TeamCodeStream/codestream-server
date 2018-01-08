'use strict';

const StreamAttributes = require(process.env.CS_API_TOP + '/modules/streams/stream_attributes');

const EXPECTED_STREAM_FIELDS = [
	'_id',
	'deactivated',
	'createdAt',
	'modifiedAt',
	'creatorId',
	'teamId',
	'type',
	'sortId'
];

const EXPECTED_CHANNEL_STREAM_FIELDS = [
	'name',
	'memberIds'
];

const EXPECTED_DIRECT_STREAM_FIELDS = [
	'memberIds'
];

const EXPECTED_FILE_STREAM_FIELDS = [
	'repoId'
];

const EXPECTED_STREAM_RESPONSE = {
	stream: EXPECTED_STREAM_FIELDS
};

const UNSANITIZED_ATTRIBUTES = Object.keys(StreamAttributes).filter(attribute => {
	return StreamAttributes[attribute].serverOnly;
});

module.exports = {
	EXPECTED_STREAM_FIELDS,
	EXPECTED_CHANNEL_STREAM_FIELDS,
	EXPECTED_DIRECT_STREAM_FIELDS,
	EXPECTED_FILE_STREAM_FIELDS,
	EXPECTED_STREAM_RESPONSE,
	UNSANITIZED_ATTRIBUTES
};
