'use strict';

const PostUserTest = require('./post_user_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class OriginUserIdTest extends PostUserTest {

	get description () {
		return 'under one-user-per-org, on inviting a new user, the user\'s originUserId attributes should be set to its id';
	}

	run (callback) {
		BoundAsync.series(this, [
			super.run,
			this.registerAndConfirmUser,
			this.validateOriginUserId
		], callback);
	}

	validateOriginUserId (callback) {
		const { user } = this.confirmResponse;
		Assert.strictEqual(user.originUserId, user.id, 'originUserId not set to user.id');
		Assert(user.copiedFromUserId === undefined, 'copiedFromUserId should not be defined');
		callback();
	}
}

module.exports = OriginUserIdTest;
