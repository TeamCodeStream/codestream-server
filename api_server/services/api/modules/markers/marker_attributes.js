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
	numPosts: {
		type: 'number'
	}
};
