'use strict';

module.exports = {
	'internal': {
		code: 'GROK-1000',
		message: 'Internal Grok error',
		internal: true
	},
	'apiError': {
		code: 'GROK-1001',
		message: 'API Error',
		description: 'The response from Grok contained an error message'
	},
	'noChoices': {
		code: 'GROK-1002',
		message: 'Zero Choices',
		description: 'The response from Grok was successful, did not contain any choices'
	},
	'choiceNoMessage': {
		code: 'GROK-1003',
		message: 'Choice Contained No Message',
		description: 'The response from Grok was successful and contained a choice, but it did not have a message'
	}
};
