// Errors related to the New Relic IDP module

'use strict';

module.exports = {
	'nrIDPInternal': {
		code: 'NRID-1000',
		message: 'Internal error',
		internal: true
	},
	'apiFailed': {
		code: 'NRID-1001',
		message: 'API call failed',
		description: 'The call to the New Relic IDP API failed'
	}
};
