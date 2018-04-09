// Errors related to the teams module

'use strict';

module.exports = {
	'usernameNotUnique': {
		code: 'TEAM-1000',
		message: 'Username is not unique for this team',
	},
	'messagingGrant': {
		code: 'TEAM-1001',
		message: 'Unable to grant user messaging permissions'
	}
};
