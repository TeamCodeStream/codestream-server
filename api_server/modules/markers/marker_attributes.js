// attributes for markers, note that we don't derive from the standard
// CodeStreamModel here, so we don't have usual attributes like creatorId, createdAt, etc.
// these aren't necessary and we save a little space and bandwidth

'use strict';

module.exports = {
	teamId: {
		type: 'string',
		maxLength: 30,
		required: true
	},
	streamId: {
		type: 'string',
		maxLength: 30,
		required: true
	},
	postId: {
		type: 'string',
		maxLength: 30,
		required: true
	},
	numComments: {
		type: 'number',
		required: true
	},
	commitHashWhenCreated: {
		type: 'string',
		minLength: 40,
		maxLength: 40
	},
	_forTesting: {
		type: 'boolean',
		serverOnly: true
	}
};
