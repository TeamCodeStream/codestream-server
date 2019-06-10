// Errors concerning the inbound email module

'use strict';

module.exports = {
	'internal': {
		code: 'INBE-1000',
		message: 'Internal inbound email error',
		internal: true
	},
	'unauthorized': {
		code: 'INBE-1001',
		message: 'Unauthorized',
		internal: true
	},
	'noFromAddress': {
		code: 'INBE-1002',
		message: 'No from address',
		internal: true
	},
	'creatorNotFound': {
		code: 'INBE-1003',
		message: 'Originator of email not found',
		internal: true
	},
	'noMatchFound': {
		code: 'INBE-1004',
		message: 'No matching stream ID found',
		internal: true
	},
	'streamNotFound': {
		code: 'INBE-1005',
		message: 'Stream not found',
		internal: true
	},
	'streamNoMatchTeam': {
		code: 'INBE-1006',
		message: 'The stream is not owned by this team',
		internal: true
	},
	'notSupported': {
		code: 'INBE-1007',
		message: 'Inbound emails are not supported for this installation',
		internal: true 
	}
};
