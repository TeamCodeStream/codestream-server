// Errors concerning the slack integration module

'use strict';

const ERRORS = {
	'internal': {
		code: 'SLIN-1000',
		message: 'Internal slack integration post error',
		internal: true
	},
	'unauthorized': {
		code: 'SLIN-1001',
		message: 'Unauthorized'
	},
	'repoNoMatchTeam': {
		code: 'SLIN-1002',
		message: 'The repo is not owned by this team'
	},
	'streamNoMatchRepo': {
		code: 'SLIN-1003',
		message: 'The stream is not from this repo'
	},
	'parentPostNoMatchStream': {
		code: 'SLIN-1004',
		message: 'The parent post is not from this stream'
	},
	'userNotOnTeam': {
		code: 'SLIN-1005',
		message: 'User originating the post is not on the team in CodeStream'
	}
};

module.exports = ERRORS;
