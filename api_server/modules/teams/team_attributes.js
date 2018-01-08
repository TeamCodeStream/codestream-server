'use strict';

module.exports = {
	companyId: {
		type: 'id',
		required: true
	},
	name: {
		type: 'string',
		maxLength: 64
	},
	memberIds: {
		type: 'arrayOfIds',
		maxLength: 256,
		required: true
	}
};
