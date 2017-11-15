'use strict';

module.exports = {
	team_id: {
		type: 'id',
		required: true
	},
	repo_id: {
		type: 'id'
	},
	type: {
		type: 'stream_type', // channel, direct, file
		max_length: 7
	},
	file: {
		type: 'string',
		max_length: 1024
	},
	name: {
		type: 'string',
		max_length: 64
	},
	member_ids: {
		type: 'array_of_ids',
		max_length: 256
	},
	most_recent_post_id: {
		type: 'id'
	}
};
