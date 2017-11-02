'use strict';

const ERRORS = {
	'token': {
		code: 'USRC-1000',
		message: 'Token error',
		internal: true
	},
	'password_mismatch': {
		code: 'USRC-1001',
		message: 'Password doesn\'t match'
	},
	'confirm_code_mismatch': {
		code: 'USRC-1002',
		message: 'Confirmation code doesn\'t match'
	},
	'confirm_code_expired': {
		code: 'USRC-1003',
		message: 'Confirmation code is expired'
	},
	'too_many_confirm_attempts': {
		code: 'USRC-1004',
		message: 'Confirmation code doesn\'t match; too many attempts'
	},
	'email_mismatch': {
		code: 'USRC-1005',
		message: 'Email doesn\'t match'
	},
	'already_registered': {
		code: 'USRC-1006',
		message: 'This user is already registered and confirmed'
	},
	'messaging_grant': {
		code: 'USRC-1007',
		message: 'Unable to grant user messaging permissions'
	}
};

module.exports = ERRORS;
