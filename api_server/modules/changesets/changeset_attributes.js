// attributes for changesets

'use strict';

module.exports = {
	teamId: {
		type: 'id',
		required: true,
		description: 'ID of the @@#team#team@@ that owns the changeset'
	},
	reviewId: {
		type: 'id',
		description: 'ID of the @@#review#review@@ that references this changeset'
	},
	repoId: {
		type: 'id',
		description: 'ID of the repo associated with this changeset'
	},
	branch: {
		type: 'string',
		description: 'branch associated with this changeset'
	},
	commits: {
		type: 'arrayOfObjects',
		maxLength: 1000,
		maxObjectLength: 1000,
		description: 'commit information associated with this changeset'
	},
	diffs: {
		type: 'arrayOfObjects',
		maxLength: 1000,
		maxObjectLength: 10000,
		description: 'diff info associated with this changeset'
	},
	modifiedFiles: {
		type: 'arrayOfObjects',
		maxLength: 1000,
		maxObjectLength: 1000,
		description: 'information about file modified in this changeset'
	},
	includeSaved: {
		type: 'boolean',
		description: 'whether saved but unstaged files are included in this changeset'
	},
	includeStaged: {
		type: 'boolean',
		description: 'whether staged files are included in this changeset'
	}
};
