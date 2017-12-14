'use strict';

module.exports = {
	companyId: {
		type: 'id',
		required: true
	},
	teamId: {
		type: 'id',
		required: true
	},
	url: {
		type: 'url',
		maxLength: 1024,
		required: true
	},
	normalizedUrl: {
		type: 'string',
		maxLength: 1024,
		required: true
	},
	firstCommitHash: {
		type: 'string',
		minLength: 40,
		maxLength: 40,
		required: true
	}
};
