// Define a generic test to test what happens when a parameter is not supplied in a test request

'use strict';

module.exports = {

	// this hook is called after the request data has been set up
	// in the hook, we'll delete the parameter in question
	requestDataHook: async (testRunner, data) => {
		const { testOptions } = testRunner;
		delete data[testOptions.parameter];
	},

	descriptionHook: (testRunner, description) => {
		const { testOptions } = testRunner;
		return description.replace(/{{{\s*(parameter)\s*}}}/g, s => {
			return testOptions.parameter;
		});
	},

	expectedError: {
		code: 'RAPI-1001',
		message: 'Parameter required',
		info: '{{{ testOptions(parameter) }}}'
	}
};

