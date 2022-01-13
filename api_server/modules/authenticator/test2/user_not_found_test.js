'use strict';

const AuthenticationTest = require('./authentication_test');
const Utils = require('./utils');

module.exports = {
	...AuthenticationTest,
	description: 'should prevent access to resources when the user found in the payload of the access token does not exist',
	tokenHook: Utils.alterUserIdInJWT,
	expectedStatus: 401,
	expectedError: {
		code: 'AUTH-1004',
		message: 'Invalid identity'
	}
};
