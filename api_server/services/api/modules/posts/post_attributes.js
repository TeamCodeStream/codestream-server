'use strict';

module.exports = {
	company_id: {
		type: 'id',
		required: true
	},
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
	commit_id: {
		type: 'string',
		max_length: 64
	},
	char_end: {
		type: 'number'
	},
	char_start: {
		type: 'number'
	},
	line_end: {
		type: 'number'
	},
	line_start: {
		type: 'number'
	},
	diff_data: {
		type: 'object',
		max_length: 4096
	},
	parent_post_id: {
		type: 'id'
	},
	text: {
		type: 'string',
		max_length: 10000
	}
};
