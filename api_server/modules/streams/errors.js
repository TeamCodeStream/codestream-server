// Errors related to the streams module

'use strict';

const ERRORS = {
	'invalidStreamType': {
		code: 'STRM-1000',
		message: 'Invalid stream type',
	},
	'nameRequired': {
		code: 'STRM-1001',
		message: 'Channel type streams must have a name'
	},
	'repoIdRequired': {
		code: 'STRM-1002',
		message: 'File type streams must have a repoId'
	},
	'fileRequired': {
		code: 'STRM-1003',
		message: 'File type streams must have a file'
	},
	'messagingGrant': {
		code: 'STRM-1004',
		message: 'Unable to grant user messaging permissions'
	},
	'noEditingNonFile': {
		code: 'STRM-1005',
		message: 'Can\'t indicate editing a non-file stream'
	}
};

module.exports = ERRORS;
