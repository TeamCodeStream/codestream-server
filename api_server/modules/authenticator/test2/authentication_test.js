'use strict';

const CodeStreamApiTest = require('../../../lib/tester/codestream_api_test');
const UserRequests = require('../../users/test2/user_requests');

module.exports = {
	...CodeStreamApiTest,
	description: 'should allow access to resources when a valid access token is supplied',
	request: {
		...UserRequests.getMe
	},
	needRegisteredUsers: 1
};
