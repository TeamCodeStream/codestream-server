// Define a generic test to test what happens when a parameter of the wrong type is supplied in a test request

'use strict';

module.exports = {

	// this hook is called after the request data has been set up
	// in the hook, we'll change the parameter in question to a value of the wrong type
	// (default valid type is string, change to number)
	requestDataHook: async (testRunner, data) => {
		const { testOptions } = testRunner;
		const { parameter, setType } = testOptions;
		const setValue = setType === 'string' ? 'string' : (
			setType === 'number' ? 1 : true
		);
		data[parameter] = setValue;
	},

	descriptionHook: (testRunner, description) => {
		const { testOptions } = testRunner;
		return description
			.replace(/{{{\s*(parameter)\s*}}}/g, s => {
				return testOptions.parameter;
			})
			.replace(/{{{\s*(setType)\s*}}}/g, s => {
				return testOptions.setType;
			});
	},

	expectedError: {
		code: 'RAPI-1012',
		message: 'Invalid parameter',
		info: '{{{ testOptions(parameter) }}}(should be {{{ testOptions(shouldBeType) }}})'
	}
};

