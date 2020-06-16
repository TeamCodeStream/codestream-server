'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');
const Assert = require('assert');
const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');

class ChangeEmailConfirmTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should change the user\'s email when requested with a proper token, assuming the new email has been confirmed';
	}

	get method () {
		return 'put';
	}

	get path () {
		return '/no-auth/change-email-confirm';
	}

	// before the test runs...
	before (callback) {
		this.testBegins = Date.now();
		this.init(callback);
	}

	// validate the response to the test request
	validateResponse (data) {
		const expectData = {
			user: {
				_id: this.currentUser.user.id,	// DEPRECATE ME
				id: this.currentUser.user.id,
				$set: {
					email: this.newEmail,
					version: 4
				},
				$version: {
					before: 3,
					after: 4
				}
			}
		};
		Assert.equal(typeof data.user.$set.modifiedAt, 'number', 'modifiedAt not set to number in response');
		Assert(data.user.$set.modifiedAt <= Date.now(), 'modifiedAt is not in the past');
		Assert(data.user.$set.modifiedAt >= this.testBegins, 'modifiedAt is not set to after the beginning of the test');
		expectData.user.$set.modifiedAt = data.user.$set.modifiedAt;
		Assert.deepEqual(data, expectData, 'invalid response');
	}
}

module.exports = ChangeEmailConfirmTest;
