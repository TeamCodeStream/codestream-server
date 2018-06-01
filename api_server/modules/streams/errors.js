// Errors related to the streams module

'use strict';

module.exports = {
	'invalidStreamType': {
		code: 'STRM-1000',
		message: 'Invalid stream type',
		description: 'An invalid stream type was sent with a request that requires a stream type'
	},
	'nameRequired': {
		code: 'STRM-1001',
		message: 'Channel type streams must have a name',
		description: 'A request was sent to create a channel stream but a name was not provided'
	},
	'repoIdRequired': {
		code: 'STRM-1002',
		message: 'File type streams must have a repoId',
		description: 'A request was sent to create a file stream but a repo ID was not provided'
	},
	'fileRequired': {
		code: 'STRM-1003',
		message: 'File type streams must have a file',
		description: 'A request was sent to create a file stream but a file path was not provided'
	},
	'streamMessagingGrant': {
		code: 'STRM-1004',
		message: 'Unable to grant user messaging permissions',
		description: 'The server was unable to grant permission to subscribe to the given stream channel'
	},
	'tooManyFiles': {
		code: 'STRM-1005',
		message: 'Too many files',
		description: 'Too many files were sent with a request'
	},
	'teamStreamMustBeChannel': {
		code: 'STRM-1006',
		message: 'Team streams must be of type channel',
		description: 'A request was sent to create a team stream from a non-channel stream'
	},
	'invalidPrivacyType': {
		code: 'STRM-1007',
		message: 'Invalid privacy type',
		description: 'An invalid privacy type was sent with the request'
	}
};
