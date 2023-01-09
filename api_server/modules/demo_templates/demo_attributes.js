// attributes for company documents/models

'use strict';

module.exports = {
	name: {
		type: 'string',
		maxLength: 256,
		description: 'Name of the company'
	},
	documents: {
		type: 'object',
		maxLength: 50000,
		description: 'Documents in template'
	}
};
