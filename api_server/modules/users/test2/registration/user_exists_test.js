'use strict';

const RegistrationTest = require('./registration_test');

module.exports = {
	...RegistrationTest,
	description: 'should return the user when registering an email that already exists as an unconfirmed user',
	needUnregisteredUsers: 1,
	cacheLocal: {
		user: [ 'users', 'unregistered', 'user' ]
	},
	request: {
		...RegistrationTest.request,
		data: {
			...RegistrationTest.request.data,
			email: '{{{ fromLocalCache(user.email) }}}'
		}
	},
	expectedResponse: {
		...RegistrationTest.expectedResponse,
		user: {
			...RegistrationTest.expectedResponse.user,
			createdAt: '{{{ fromLocalCache(user.createdAt) }}}',
			version: '{{{ incrementFromLocalCache(user.version) }}}'
		}
	}
};
