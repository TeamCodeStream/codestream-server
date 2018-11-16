// attributes for company documents/models

'use strict';

module.exports = {
	name: {
		type: 'string',
		maxLength: 256,
		description: 'Name of the company'
	},
	teamIds: {
		type: 'arrayOfIds',
		maxLength: 256,
		description: 'Teams owned by the company'
	}
};
