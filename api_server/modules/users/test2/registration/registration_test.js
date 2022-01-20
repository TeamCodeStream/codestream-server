'use strict';

const CodeStreamApiTest = require('../../../../lib/tester/codestream_api_test');
const UserRequests = require('../user_requests');
const RegistrationTestRequestData = require('./registration_test_request_data');
const RegistrationTestResponseData = require('./registration_test_response_data');

module.exports = {
	...CodeStreamApiTest,
	description: 'should return valid user data when registering',
	request: {
		...UserRequests.register,
		data: {
			email: '{{{ randomEmail }}}',
			password: '{{{ randomPassword }}}',
			username: '{{{ randomUsername }}}',
		}
	},
	expectedResponse: {
		user: {
			id: '{{{ newId }}}',
			_id: '{{{ sameAs(id) }}}',
			version: 1,
			deactivated: false,
			providerIdentities: [],
			createdAt: '{{{ currentTimestamp }}}',
			modifiedAt: '{{{ closeTo(createdAt) }}}',
			email: '{{{ requestData(email) }}}',
			username: '{{{ requestData(username) }}}',
			creatorId: '{{{ sameAs(id) }}}'
		}
	}
};
