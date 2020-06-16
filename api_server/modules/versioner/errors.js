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
	}
};
