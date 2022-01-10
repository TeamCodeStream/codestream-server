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
	/* deprecated in favor of provider module errors
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
	*/
	'inviteTeamMismatch': {
		code: 'USRC-1016',
		message: 'The team the user was invited to does not match the CodeStream team associated with their third-party provider account',
		description: 'The user was invited to a team, but the ID of the team they were invited to does not match the ID of the team that matches the third-party team associated with their third-party credentials'
	},
	/* deprecated in favor of provider module errors
	'unknownProviderHost': {
		code: 'USRC-1017',
		message: 'The third-party provider host can not be matched to a known enterprise host',
		description: 'Enterprise customers should configure their installation with the hosts they wish users to be able to connect to for on-premise third-party integrations; the host passed in the request was not found among the known hosts for this installation'
	},
	'identityMatchingNotSupported': {
		code: 'USRC-1018',
		message: 'Identity matching is not supported for this third-party provider',
		description: 'This third-party provider does not support matching an identity with a user on CodeStream'
	},
	'noIdentityMatch': {
		code: 'USRC-1019',
		message: 'No CodeStream identity was found to match the identity from third-party provider authentication',
		description: 'After completing third-party provider authentication, a matching identity on CodeStream could not be found'
	},
	*/
	'inviteMismatch': {
		code: 'USRC-1020',
		message: 'An attempt was made to register using an invite code, but the email in the registration request belongs to a different user for which there is an outstanding invitation',
		description: 'If two users are invited, and one of them uses an invite code but attempts to register with the email associated with a different user who has been invited, there is an ambiguity in how to proceed with the registration. This ambiguity must be resolved by the inviting user.'
	},
	'alreadyAccepted': {
		code: 'USRC-1021',
		message: 'An attempt was made to register a user associated with an invite code, but the user associated with the invite code is already registered',
		description: 'If a user is invited, and they register with an email that does not match the original invited user, but the invited user is already registered, we can not proceed because we would be changing the email of a registered user.'
	},
	'providerLoginFailed': {
		code: 'USRC-1022',
		message: 'The attempt to sign-in with a given third-party provider failed',
		description: 'The attempt to sign-in with a given third-party provider failed'
	},
	'inMaintenanceMode': {
		code: 'USRC-1023',
		message: 'User is in maintenance mode',
		description: 'The user\'s account has been set for maintenance mode'
	},
	'mustSetPassword': {
		code: 'USRC-1024',
		message: 'User must set a password',
		description: 'The user cannot continue to use this account until they set a password'
	},
	'emailTaken': {
		code: 'USRC-1025',
		message: 'The email is already taken',
		description: 'The user is trying to change their email, but that email is already taken'
	},
	'emailIsWebmail': {
		code: 'USRC-1026',
		message: 'Webmail email addresses need to be confirmed',
		description: 'The user tried to register using a webmail email address, but we need to make sure they really want to do this, rather than using a domain address'
	},
	'failedToFetchNRData': {
		code: 'USRC-1027',
		message: 'Could not fetch required data from New Relic',
		description: 'The user tried to register using a New Relic API key, but we were unable to fetch the required data from the server'
	},
	'loginCodeExpired': {
		code: 'USRC-1028',
		message: 'Login code is expired',
		description: 'The provided login code is expired; the user must obtain another login code'
	},
	'tooManyLoginCodeAttempts': {
		code: 'USRC-1029',
		message: 'Too many attempts',
		description: 'Too many attempts have been made to login via code; a new login code must be obtained for the user'
	},
	'loginCodeMismatch': {
		code: 'USRC-1030',
		message: 'Login code doesn\'t match',
		description: 'The provided login code doesn\'t match the expected login code for the user'
	}
};
