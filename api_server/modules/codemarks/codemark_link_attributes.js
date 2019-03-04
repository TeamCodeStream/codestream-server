// attributes for codemark links, note that we don't derive from the standard
// CodeStreamModel here, so we don't have usual attributes like creatorId, createdAt, etc.
// these aren't necessary and we save a little space and bandwidth

'use strict';

module.exports = {
	teamId: {
		type: 'string',
		maxLength: 30,
		required: true,
		description: 'ID of the @@#team#team@@ that owns the codemark to which this link refers'
	},
	codemarkId: {
		type: 'id',
		required: true,
		description: 'ID of the @@#codemark#codemark@@ linked to by this link'
	},
	_forTesting: {
		type: 'boolean',
		serverOnly: true
	}
};
