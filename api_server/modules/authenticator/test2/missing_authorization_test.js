'use strict';

const AuthenticationTest = require('./authentication_test');

module.exports = {
	...AuthenticationTest,
	description: 'should prevent access to resources when no access token is supplied',
	suppressToken: true,
	expectedStatus: 401,
	expectedError: {
		code: 'AUTH-1001',
		message: 'Authorization missing'
	}
};
