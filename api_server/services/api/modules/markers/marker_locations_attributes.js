'use strict';

module.exports = {
	_id: {
		type: 'string',
		maxLength: 60
	},
	teamId: {
		type: 'string',
		maxLength: 30
	},
	streamId: {
		type: 'string',
		maxLength: 30
	},
	commitHash: {
		type: 'string',
		maxLength: 40
	},
	locations: {
		type: 'object'
	}
};
