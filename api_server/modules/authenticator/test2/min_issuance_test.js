'use strict';

const AuthenticationTest = require('./authentication_test');
const Utils = require('./utils');

module.exports = {
	...AuthenticationTest,
	description: 'should prevent access to resources when the issuance of an access token precedes the minimum issuance for the user',
	tokenHook: Utils.alterIssuanceInJWT,
	expectedStatus: 401,
	expectedError: {
		code: 'AUTH-1005',
		message: 'Token expired',
		reason: 'token has been deprecated by a more recent issuance'
	}
};
