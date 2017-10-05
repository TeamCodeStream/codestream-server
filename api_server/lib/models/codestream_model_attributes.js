'use strict';

module.exports = {
	_id: {
		type: 'id'
	},
	created_at: {
		type: 'timestamp',
		required: true
	},
	deactivated: {
		type: 'boolean',
		required: true
	},
	modified_at: {
		type: 'timestamp',
		required: true
	},
	creator_id: {
		type: 'id'
	}
};