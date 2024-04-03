// Errors related to the web module

'use strict';

module.exports = {
	'internalError': {
		code: 'SWEB-1000',
		message: 'Oops, something went wrong.'
	},
	'workspaceNotFound': {
		code: 'SWEB-1001',
		message: 'Workspace not found on CodeStream.'
	},
	'userNotFound': {
		code: 'SWEB-1002',
		message: '{{email}} not found on CodeStream.'
	},
	'noAccessToCodemark': {
		code: 'SWEB-1003',
		message: 'You don’t have access to this codemark.'
	},
	'unknownError': {
		code: 'SWEB-1004',
		message: 'An unknown error occurred, code {{error}}.'
	},
	'userNotRegistered': {
		code: 'SWEB-1005',
		message: 'User is not yet registered on CodeStream.'
	},
	'providerLoginFailed': {
		code: 'SWEB-1006',
		message: 'Provider login failed.'
	},
	'tokenExpired': {
		code: 'SWEB-1007',
		message: 'Authentication token expired.'
	},
	'invalidLogin': {
		code: 'SWEB-1008',
		message: 'Sorry, you entered an incorrect email or password.'
	},
	'noUser': {
		code: 'SWEB-1009',
		message: 'No user can be associated with this authorization flow'
	},
	'loginCodeMismatch': {
		code: 'SWEB-1010',
		message: 'Sorry, you entered an incorrect login code.'
	},
	'loginCodeExpired': {
		code: 'SWEB-1011',
		message: 'Sorry, that login code has expired.'
	},
	'tooManyLoginCodeAttempts': {
		code: 'SWEB-1012',
		message: 'Sorry, you have made too many attempts to log in via code. You must obtain a new login code.'
	}
};
