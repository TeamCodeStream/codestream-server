// Errors concerning the versioner module

'use strict';

module.exports = {
	'internal': {
		code: 'VERS-1000',
		message: 'Internal versioning error',
		internal: true
	},
	'versionNotSupported': {
		code: 'VERS-1001',
		message: 'Version not supported',
		description: 'This version of the IDE plugin is no longer supported'
	},
	'inMaintenanceMode': {
		code: 'VERS-1002',
		message: 'User is in maintenance mode',
		description: 'The user\'s account has been set for maintenance mode'
	}
};
