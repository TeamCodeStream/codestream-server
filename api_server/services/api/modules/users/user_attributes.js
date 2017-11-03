'use strict';

module.exports = {
	company_ids: {
		type: 'array_of_ids',
		max_length: 256
	},
	team_ids: {
		type: 'array_of_ids',
		max_length: 256
	},
	email: {
		type: 'email',
		max_length: 256,
		required: true
	},
	searchable_email: {
		type: 'email',
		max_length: 256,
		required: true,
		server_only: true
	},
	secondary_emails: {
		type: 'array_of_emails',
		max_length: 20,
		max_email_length: 256
	},
	username: {
		type: 'username',
		max_length: 21
	},
	searchable_username: {
		type: 'username',
		max_length: 21,
		lowercase_only: true,
		server_only: true
	},
	is_registered: {
		type: 'boolean'
	},
	first_name: {
		type: 'string',
		max_length: 128
	},
	last_name: {
		type: 'string',
		max_length: 128
	},
	password_hash: {
		type: 'string',
		max_length: 64,
		server_only: true
	},
	confirmation_code: {
		type: 'string',
		max_length: 6,
		server_only: true
	},
	confirmation_attempts: {
		type: 'number',
		server_only: true
	},
	confirmation_code_expires_at: {
		type: 'timestamp',
		server_only: true
	}
};
