// test constants for testing the streams module

'use strict';

const StreamAttributes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/streams/stream_attributes');

// fields expected in all streams
const EXPECTED_STREAM_FIELDS = [
	'id',
	'deactivated',
	'createdAt',
	'modifiedAt',
	'creatorId',
	'teamId',
	'type',
	'sortId'
];

// fields expected for team streams
const EXPECTED_TEAM_STREAM_FIELDS = [
	'name',
	'isTeamStream'
];

// fields expected for channel streams
const EXPECTED_CHANNEL_STREAM_FIELDS = [
	'name',
	'purpose',
	'memberIds'
];

// fields expected for direct streams
const EXPECTED_DIRECT_STREAM_FIELDS = [
	'memberIds'
];

// fields expected for file-type streams
const EXPECTED_FILE_STREAM_FIELDS = [
	'repoId',
	'file'
];

// fields expected for object-type streams
const EXPECTED_OBJECT_STREAM_FIELDS = [
	'objectId',
	'objectType'
];

const EXPECTED_STREAM_RESPONSE = {
	stream: EXPECTED_STREAM_FIELDS
};

const UNSANITIZED_ATTRIBUTES = Object.keys(StreamAttributes).filter(attribute => {
	return StreamAttributes[attribute].serverOnly;
});

module.exports = {
	EXPECTED_STREAM_FIELDS,
	EXPECTED_TEAM_STREAM_FIELDS,
	EXPECTED_CHANNEL_STREAM_FIELDS,
	EXPECTED_DIRECT_STREAM_FIELDS,
	EXPECTED_FILE_STREAM_FIELDS,
	EXPECTED_OBJECT_STREAM_FIELDS,	
	EXPECTED_STREAM_RESPONSE,
	UNSANITIZED_ATTRIBUTES
};
