// Errors concerning the mongo library

'use strict';

module.exports = {
	'data': {
		code: 'MDTA-1000',
		description: 'Internal data error',
		internal: true
	},
	'id': {
		code: 'MDTA-1001',
		description: 'Document must have ID attribute',
		internal: true
	},
	'hintRequired': {
		code: 'MDTA-1002',
		description: 'Hint required',
		internal: true
	},
	'updateFailureNoVersion': {
		code: 'MDTA-1003',
		description: 'Failed to update document with version, but version is not conflicting',
		internal: true
	},
	'updateFailureVersion': {
		code: 'MDTA-1004',
		description: 'Failed to update document after refetching for version and several retries',
		internal: true
	}
};
