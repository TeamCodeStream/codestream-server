'use strict';

module.exports = {
	team_id: {
		type: 'id',
		required: true
	},
	repo_id: {
		type: 'id'
	},
	stream_id: {
		type: 'id',
		required: true
	},
	commit_sha_when_posted: {
		type: 'string',
		min_length: 40,
		max_length: 40
	},
	location: {
		type: 'object',
		max_length: 200
	},
	replay_info: {
		type: 'object',
		max_length: 50000
	},
	parent_post_id: {
		type: 'id'
	},
	text: {
		type: 'string',
		max_length: 10000
	}
};
