'use strict';

const ERRORS = {
	'invalid_stream_type': {
		code: 'STRM-1000',
		message: 'Invalid stream type',
	},
	'name_required': {
		code: 'STRM-1001',
		message: 'Channel type streams must have a name'
	},
	'repo_id_required': {
		code: 'STRM-1002',
		message: 'File type streams must have a repo_id'
	},
	'file_required': {
		code: 'STRM-1003',
		message: 'File type streams must have a file'
	},
	'messaging_grant': {
		code: 'STRM-1004',
		message: 'Unable to grant user messaging permissions'
	}
};

module.exports = ERRORS;
