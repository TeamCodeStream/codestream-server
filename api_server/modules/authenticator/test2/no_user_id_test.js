'use strict';

const AuthenticationTest = require('./authentication_test');
const Utils = require('./utils');

module.exports = {
	...AuthenticationTest,
	description: 'should prevent access to resources when no userId found in the payload of the access token',
	tokenHook: Utils.removeUserIdFromJWT,
	expectedStatus: 401,
	expectedError: {
		code: 'AUTH-1003',
		message: 'Credentials invalid'
	}
};
