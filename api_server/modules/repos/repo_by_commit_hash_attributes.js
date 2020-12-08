// attributes for repo-by-commit-hash documents/models

'use strict';

module.exports = {
	repoId: {
		type: 'id',
		description: 'ID of the @@#repo#repo@@ with which this commit hash is associated',
		required: true
	},
	_forTesting: {
		type: 'boolean',
		serverOnly: true
	}
};
