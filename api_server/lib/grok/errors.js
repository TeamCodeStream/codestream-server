'use strict';

module.exports = {
	'apiException': {
		code: 'GROK-1000',
		message: 'API Exception',
		description: 'There was an exception calling the Grok API',
	},
	'apiResponseContainedError': {
		code: 'GROK-1001',
		message: 'API Error',
		description: 'The response from Grok contained an error message'
	},
	'apiResponseContainedNoChoice': {
		code: 'GROK-1002',
		message: 'Zero Choices',
		description: 'The response from Grok was successful, did not contain any choices'
	},
	'apiResponseContainedNoChoiceMessage': {
		code: 'GROK-1003',
		message: 'Choice Contained No Message',
		description: 'The response from Grok was successful and contained a choice, but it did not have a message'
	},
	'apiResponseNotJson': {	
		code: 'GROK-1004',
		message: 'The API Response from AIR was not JSON',
		description: 'The response from Grok was successful, but the response was not JSON'
	}
};
