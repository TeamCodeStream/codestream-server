// Errors related to the teams module

'use strict';

module.exports = {
	'usernameNotUnique': {
		code: 'TEAM-1000',
		message: 'Username is not unique for this team',
		description: 'An attempt was made to create a user on a team, but there is another active user on the team with the same username'
	},
	'teamMessagingGrant': {
		code: 'TEAM-1001',
		message: 'Unable to grant user messaging permissions',
		description: 'The server was unable to grant permission to subscribe to the given team channel'
	},
	'adminsOnly': {
		code: 'TEAM-1002',
		message: 'Only admins can perform this operation',
		description: 'The user performed an operation that is only allowed for administrators, and the user is not an administrator'
	},
	'notAuthorizedToJoin': {
		code: 'TEAM-1003',
		message: 'Not authorized to join this team',
		description: 'The user is attempting to join a team but does not have the proper conditions in their account to do so'
	}
};
