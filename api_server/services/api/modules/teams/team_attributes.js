'use strict';

module.exports = {
	company_id: {
		type: 'id',
		required: true
	},
	name: {
		type: 'string',
		max_length: 64
	},
	member_ids: {
		type: 'array_of_ids',
		max_length: 256,
		required: true
	}
};
