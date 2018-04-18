// Errors concerning integration modules

'use strict';

module.exports = {
	'internal': {
		code: 'INTG-1000',
		message: 'Internal integration post error',
		internal: true
	},
	'unauthorized': {
		code: 'INTG-1001',
		message: 'Unauthorized'
	},
	'repoNoMatchTeam': {
		code: 'INTG-1002',
		message: 'The repo is not owned by this team'
	},
	'streamNoMatchRepo': {
		code: 'INTG-1003',
		message: 'The stream is not from this repo'
	},
	'parentPostNoMatchStream': {
		code: 'INTG-1004',
		message: 'The parent post is not from this stream'
	},
	'userNotOnTeam': {
		code: 'INTG-1005',
		message: 'User originating the post is not on the team in CodeStream'
	}
};
