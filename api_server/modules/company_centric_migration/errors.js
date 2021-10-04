// Errors concerning the company-centric migration module

'use strict';

module.exports = {
	'internal': {
		code: 'VERS-1000',
		message: 'Internal error',
		internal: true
	},
	'needsRefresh': {
		code: 'CCMG-1001',
		message: 'Client needs to refresh',
		description: 'Client needs to refresh, after which company-centric migration should be complete'
	},
	'migrationInProgress': {
		code: 'CCMG-1002',
		message: 'Client needs to wait',
		description: 'Client needs to wait for company-centric migration to complete; client should poll until successful and then refresh'
	}
};
