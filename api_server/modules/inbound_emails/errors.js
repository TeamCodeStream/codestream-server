// Errors concerning the inbound email module

'use strict';

const ERRORS = {
	'internal': {
		code: 'INBE-1000',
		message: 'Internal inbound email error',
		internal: true
	},
	'unauthorized': {
		code: 'INBE-1001',
		message: 'Unauthorized'
	},
	'noFromAddress': {
		code: 'INBE-1002',
		message: 'No from address',
		internal: true
	},
	'creatorNotFound': {
		code: 'INBE-1003',
		message: 'Originator of email not found'
	},
	'noMatchFound': {
		code: 'INBE-1004',
		message: 'No matching stream ID found'
	},
	'streamNotFound': {
		code: 'INBE-1005',
		message: 'Stream not found'
	},
	'streamNoMatchTeam': {
		code: 'INBE-1006',
		message: 'The stream is not owned by this team'
	}
};

module.exports = ERRORS;
