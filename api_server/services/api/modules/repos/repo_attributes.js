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
	url: {
		type: 'url',
		max_length: 1024,
		required: true
	},
	first_commit_sha: {
		type: 'string',
		min_length: 40,
		max_length: 40,
		required: true
	}
};
