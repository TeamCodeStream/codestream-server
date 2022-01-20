'use strict';

const RegistrationTest = require('./registration_test');
const RandomString = require('randomstring');

module.exports = {
	...RegistrationTest,
	description: 'should return an error when registering with an invalid password',

	// this hook is called after the request data has been set up
	// in the hook, we'll change the password to an invalid password
	requestDataHook: async (testRunner, data) => {
		data.password = RandomString.generate(5); // password must be at least 6 characters
		data.username += '%';
	},

	expectedError: {
		code: 'RAPI-1005',
		message: 'Validation error',
		info: {
			password: 'must be at least six characters'
		}
	}
};
