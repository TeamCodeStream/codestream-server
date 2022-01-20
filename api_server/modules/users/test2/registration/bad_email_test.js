'use strict';

const RegistrationTest = require('./registration_test');
const RandomString = require('randomstring');

module.exports = {
	...RegistrationTest,
	description: 'should return an error when registering with an invalid email',

	// this hook is called after the request data has been set up
	// in the hook, we'll change the email to an invalid email
	requestDataHook: async (testRunner, data) => {
		data.email = RandomString.generate(12);
	},

	expectedError: {
		code: 'RAPI-1005',
		message: 'Validation error',
		info: {
			email: 'invalid email'
		}
	}
};
