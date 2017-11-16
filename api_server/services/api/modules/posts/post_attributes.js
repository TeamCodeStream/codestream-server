'use strict';

module.exports = {
	teamId: {
		type: 'id',
		required: true
	},
	repoId: {
		type: 'id'
	},
	streamId: {
		type: 'id',
		required: true
	},
	commitShaWhenPosted: {
		type: 'string',
		minLength: 40,
		maxLength: 40
	},
	location: {
		type: 'object',
		maxLength: 200
	},
	replayInfo: {
		type: 'object',
		maxLength: 50000
	},
	parentPostId: {
		type: 'id'
	},
	text: {
		type: 'string',
		maxLength: 10000
	}
};
