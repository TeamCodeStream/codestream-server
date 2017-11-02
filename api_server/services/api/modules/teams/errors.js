'use strict';

const ERRORS = {
	'username_not_unique': {
		code: 'TEAM-1000',
		message: 'Username is not unique for this team',
	},
	'messaging_grant': {
		code: 'TEAM-1001',
		message: 'Unable to grant user messaging permissions'
	}
};

module.exports = ERRORS;
