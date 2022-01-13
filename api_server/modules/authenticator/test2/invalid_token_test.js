'use strict';

const AuthenticationTest = require('./authentication_test');

module.exports = {
	...AuthenticationTest,
	description: 'should prevent access to resources when access token is invalid',
	sendInvalidToken: true,
	expectedStatus: 401,
	expectedError: {
		code: 'AUTH-1002',
		message: 'Token invalid',
		reason: 'jwt malformed'
	}
};
