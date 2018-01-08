// attributes for markers, note that we don't derive from the standard
// CodeStreamModel here, so we don't have usual attributes like creatorId, createdAt, etc.
// these aren't necessary and we save a little space and bandwidth

'use strict';

module.exports = {
	_id: {
		type: 'string',
		maxLength: 30,
		required: true
	},
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
	deactivated: {
		type: 'boolean',
		required: true
	},
	numComments: {
		type: 'number',
		required: true
	}
};
