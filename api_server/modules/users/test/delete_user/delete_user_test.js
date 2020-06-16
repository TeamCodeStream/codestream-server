// base class for many tests of the "DELETE /users/:id" requests

'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');
const UserTestConstants = require('../user_test_constants');

class DeleteUserTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should return the deactivated user when deleting a user';
	}

	get method () {
		return 'delete';
	}

	// before the test runs...
	before (callback) {
		this.init(callback);
	}

	// validate the response to the test request
	validateResponse (data) {
		const user = data.user;
		// make sure the email and searchable email is set to deactivated form (with a '-deactivated<timestamp>' part)
		const email = this.user.email;
		const emailParts = email.split('@');
		const emailRegex = new RegExp(`${emailParts[0]}-deactivated([0-9]*)@${emailParts[1]}`);
		const emailMatch = user.$set.email.match(emailRegex);
		Assert(emailMatch, 'email not set to deactivated form');
		const deactivatedAt = parseInt(emailMatch[1]);
		Assert(deactivatedAt >= this.modifiedAfter, 'deactivated timestamp is not greater than before the user was deleted');
		this.expectedData.user.$set.email = `${emailParts[0]}-deactivated${emailMatch[1]}@${emailParts[1]}`;

		// verify modifiedAt was updated, and then set it so the deepEqual works
		Assert(user.$set.modifiedAt >= this.modifiedAfter, 'modifiedAt is not greater than before the user was deleted');
		this.expectedData.user.$set.modifiedAt = user.$set.modifiedAt;

		// verify we got back the proper response
		Assert.deepEqual(data, this.expectedData, 'response data is not correct');

		// verify the user in the response has no attributes that should not go to clients
		this.validateSanitized(user.$set, UserTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = DeleteUserTest;
