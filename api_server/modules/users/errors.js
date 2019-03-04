// Errors related to the users module

'use strict';

module.exports = {
	'token': {
		code: 'USRC-1000',
		message: 'Token error',
		internal: true
	},
	'passwordMismatch': {
		code: 'USRC-1001',
		message: 'Password doesn\'t match',
		description: 'The provided password doesn\'t match the password for the user'
	},
	'confirmCodeMismatch': {
		code: 'USRC-1002',
		message: 'Confirmation code doesn\'t match',
		description: 'The provided confirmation code doesn\'t match the expected confirmation code for the user'
	},
	'confirmCodeExpired': {
		code: 'USRC-1003',
		message: 'Confirmation code is expired',
		description: 'The provided confirmation code is expired; the user must obtain another confirmation code'
	},
	'tooManyConfirmAttempts': {
		code: 'USRC-1004',
		message: 'Confirmation code doesn\'t match; too many attempts',
		description: 'Too many attempts have been made to confirm registration; a new confirmation code must be obtained for the user'
	},
	'emailMismatch': {
		code: 'USRC-1005',
		message: 'Email doesn\'t match',
		description: 'The provided email doesn\'t match the expected email for this request'
	},
	'alreadyRegistered': {
		code: 'USRC-1006',
		message: 'This user is already registered and confirmed',
		description: 'An attempt was made to confirm a user who is already confirmed'
	},
	'userMessagingGrant': {
		code: 'USRC-1007',
		message: 'Unable to grant user messaging permissions',
		description: 'The server was unable to grant permission to subscribe to the given user channel'
	},
	'invalidGrantChannel': {
		code: 'USRC-1008',
		message: 'Invalid grant channel',
		description: 'A request was made to grant access to a subscription channel that is invalid or unrecognized'
	},
	/* deprecated
	'invalidBetaCode': {
		code: 'USRC-1009',
		message: 'Invalid beta code'
	},
	*/
	'noLoginUnregistered': {
		code: 'USRC-1010',
		message: 'User has not yet confirmed registration',
		description: 'An attempt was made to login to an account for which the user has not yet confirmed registration'
	},
	'generalMessagingGrant': {
		code: 'USRC-1011',
		message: 'Unable to grant user messaging permissions',
		description: 'The server was unable to grant permission to subscribe to the given channel'
	},
	'userNotOnTeam': {
		code: 'USRC-1012',
		message: 'This user is not yet on a team',
		description: 'The user indicated by the passed signup token is not yet on any teams, so they are not cleared yet for sign-in'
	},
	'unknownProvider': {
		code: 'USRC-1013',
		message: 'Provider unknown',
		description: 'The provider info passed in has an unknown type'
	},
	'invalidProviderCredentials': {
		code: 'USRC-1014',
		message: 'Supplied provider credentials were found to be invalid',
		description: 'The provider info passed contained credentials that the server tried to validate, but the validation failed'
	},
	'duplicateProviderAuth': {
		code: 'USRC-1015',
		message: 'The user already has credentials for this provider',
		description: 'The provider info passed contained credentials for a third-party provider that did not match the credentials the user already has for the provider'
	},
	'inviteTeamMismatch': {
		code: 'USRC-1016',
		message: 'The team the user was invited to does not match the CodeStream team associated with their third-party provider account',
		description: 'The user was invited to a team, but the ID of the team they were invited to does not match the ID of the team that matches the third-party team associated with their third-party credentials'
	},
	'unknownProviderHost': {
		code: 'USRC-1017',
		message: 'The third-party provider host can not be matched to a known enterprise host',
		description: 'Enterprise customers should configure their installation with the hosts they wish users to be able to connect to for on-premise third-party integrations; the host passed in the request was not found among the known hosts for this installation'
	}
};
