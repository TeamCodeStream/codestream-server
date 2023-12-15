'use strict';

module.exports = {
	'apiException': {
		code: 'GROK-1000',
		message: 'API Exception',
		description: 'There was an exception calling the New Relic AI API',
	},
	'apiResponseContainedError': {
		code: 'GROK-1001',
		message: 'API Error',
		description: 'The response from the New Relic AI API contained an error message'
	},
	'apiResponseContainedNoChoice': {
		code: 'GROK-1002',
		message: 'Zero Choices',
		description: 'The response from the New Relic AI API was successful, did not contain any choices'
	},
	'apiResponseContainedNoChoiceMessage': {
		code: 'GROK-1003',
		message: 'Choice Contained No Message',
		description: 'The response from the New Relic AI API was successful and contained a choice, but it did not have a message'
	}
};
