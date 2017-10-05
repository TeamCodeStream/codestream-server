'use strict';

const ERRORS = {
	'internal': {
		code: 'AUTH-1000',
		message: 'Internal authentication error',
		internal: true
	},
	'missing_authorization': {
		code: 'AUTH-1001',
		message: 'Authorization missing'
	},
	'token_invalid': {
		code: 'AUTH-1002',
		message: 'Token invalid',
		internal: true
	},
	'no_user_id': {
		code: 'AUTH-1003',
		message: 'Credentials invalid'
	},
	'user_not_found': {
		code: 'AUTH-1004',
		message: 'Invalid identity'
	}
};

module.exports = ERRORS;
