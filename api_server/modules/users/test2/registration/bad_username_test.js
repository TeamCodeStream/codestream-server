'use strict';

const RegistrationTest = require('./registration_test');

module.exports = {
	...RegistrationTest,
	description: 'should return an error when registering with an invalid username',

	// this hook is called after the request data has been set up
	// in the hook, we'll change the username to an invalid username
	requestDataHook: async (testRunner, data) => {
		data.username += '%'; // this character not allowed
	},

	expectedError: {
		code: 'RAPI-1005',
		message: 'Validation error',
		info: {
			username: 'can only contain alphanumerics, hyphen, period, and underscore'
		}
	}
};
