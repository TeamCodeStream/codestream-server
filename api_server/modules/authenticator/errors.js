// Errors concerning the authenticator module

'use strict';

module.exports = {
	'internal': {
		code: 'AUTH-1000',
		message: 'Internal authentication error',
		internal: true
	},
	'missingAuthorization': {
		code: 'AUTH-1001',
		message: 'Authorization missing',
		description: 'Authorization credentials are required for this request'
	},
	'tokenInvalid': {
		code: 'AUTH-1002',
		message: 'Token invalid'
	},
	'noUserId': {
		code: 'AUTH-1003',
		message: 'Credentials invalid',
		description: 'The passed credentials are invalid'
	},
	'userNotFound': {
		code: 'AUTH-1004',
		message: 'Invalid identity',
		description: 'The credentials passed are valid, but the associated identity is not'
	},
	'tokenExpired': {
		code: 'AUTH-1005',
		message: 'Token expired',
		description: 'The credentials passed are expired or have been deprecated'
	},
	'tokenNotFound': {
		code: 'AUTH-1006',
		message: 'The passed signup token was not found',
		description: 'The signup token associated with this login was not found, usually means the authorization flow has not yet completed'
	}
};
