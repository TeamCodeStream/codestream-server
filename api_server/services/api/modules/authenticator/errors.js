'use strict';

const ERRORS = {
	'internal': {
		code: 'AUTH-1000',
		message: 'Internal authentication error',
		internal: true
	},
	'missingAuthorization': {
		code: 'AUTH-1001',
		message: 'Authorization missing'
	},
	'tokenInvalid': {
		code: 'AUTH-1002',
		message: 'Token invalid',
		internal: true
	},
	'noUserId': {
		code: 'AUTH-1003',
		message: 'Credentials invalid'
	},
	'userNotFound': {
		code: 'AUTH-1004',
		message: 'Invalid identity'
	}
};

module.exports = ERRORS;
