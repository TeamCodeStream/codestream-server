// attributes for repo-by-commit-hash documents/models

'use strict';

module.exports = {
	commitHash: {
		type: 'string',
		minLength: 40,
		maxLength: 40,
		required: true,
		description: 'Commit hash to associate with the repo'
	},
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
