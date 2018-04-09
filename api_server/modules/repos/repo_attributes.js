// attributes for repo documents/models

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
		type: 'string',
		maxLength: 1024,
		required: true
	},
	normalizedUrl: {
		type: 'string',
		maxLength: 1024,
		required: true
	},
	companyIdentifier: {
		type: 'string',
		maxLength: 256,
		required: true
	},
	firstCommitHash: {
		type: 'string',
		minLength: 40,
		maxLength: 40,
		required: true
	},
	knownCommitHashes: {
		type: 'arrayOfStrings'
	}
};
