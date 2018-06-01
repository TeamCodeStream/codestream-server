// attributes for marker locations, note that we don't derive from the standard
// CodeStreamModel here, so we don't have usual attributes like creatorId, createdAt, etc.
// these aren't necessary and we save a little space and bandwidth

'use strict';

module.exports = {
	teamId: {
		type: 'string',
		maxLength: 30,
		description: 'ID of the @@#team#team@@ that owns the stream to which these marker locations refer to'
	},
	streamId: {
		type: 'string',
		maxLength: 30,
		description: 'ID of the file @@#stream#stream@@ to which these marker locations refer to'
	},
	commitHash: {
		type: 'string',
		maxLength: 40,
		description: 'Commit SHA that these marker locations are valid for'
	},
	locations: {
		type: 'object',
		description: 'Hash of locations: keys are @@#marker#marker@@ IDs, values are location coordinates for the given marker in the @@#stream#stream@@ at the given commit hash for this set of marker locations'
	},
	_forTesting: {
		type: 'boolean',
		serverOnly: true
	}
};
