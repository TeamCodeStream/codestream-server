'use strict';

const ERRORS = {
	'data': {
		code: 'MDTA-1000',
		description: 'Internal data error',
		internal: true
	},
	'id': {
		code: 'MDTA-1001',
		description: 'Document must have ID attribute',
		internal: true
	}
};

module.exports = ERRORS;
