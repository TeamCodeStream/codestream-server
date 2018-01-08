// attributes for marker locations, note that we don't derive from the standard
// CodeStreamModel here, so we don't have usual attributes like creatorId, createdAt, etc.
// these aren't necessary and we save a little space and bandwidth

'use strict';

module.exports = {
	teamId: {
		type: 'string',
		maxLength: 30
	},
	streamId: {
		type: 'string',
		maxLength: 30
	},
	commitHash: {
		type: 'string',
		maxLength: 40
	},
	locations: {
		type: 'object'
	}
};
