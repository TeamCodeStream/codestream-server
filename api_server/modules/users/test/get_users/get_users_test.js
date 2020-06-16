// provide a base class to use for testing the "GET /users" request

'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const UserTestConstants = require('../user_test_constants');

class GetUsersTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 3;
		this.teamOptions.numAdditionalInvites = 3;
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.setPath(callback);
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		// validate we got back the users expected, and ensure no attributes that shouldn't be seen by clients
		this.validateMatchingObjects(this.myUsers, data.users, 'users');
		this.validateSanitizedObjects(data.users, UserTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetUsersTest;
