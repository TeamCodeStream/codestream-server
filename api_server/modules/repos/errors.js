'use strict';

const ERRORS = {
	'shaMismatch': {
		code: 'REPO-1000',
		message: 'SHA of first commit doesn\'t match'
	},
	'messagingGrant': {
		code: 'REPO-1001',
		message: 'Unable to grant user messaging permissions'
	}
};

module.exports = ERRORS;
