// base class for many tests of the "GET /no-auth/unfollow-link/review/:id" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');
const TokenHandler = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/token_handler');

class CommonInit {

	init (callback) {
		BoundAsync.series(this, [
			CodeStreamAPITest.prototype.before.bind(this),
			this.makeTestData		// make the data to use when issuing the test request
		], callback);
	}

	// make the data to use when issuing the test request
	makeTestData (callback) {
		const expectedVersion = 6;
		this.token = new TokenHandler(this.apiConfig.sharedSecrets.auth).generate(
			{
				uid: this.tokenUserId || this.currentUser.user.id
			},
			this.tokenType || 'unsscr'
		);


		this.message = {
			user: {
				_id: this.currentUser.user.id,	// DEPRECATE ME
				id: this.currentUser.user.id,
				$set: {
					version: expectedVersion,
					modifiedAt: Date.now(), // placeholder
					'preferences.weeklyEmailDelivery': false
				},
				$version: {
					before: expectedVersion - 1,
					after: expectedVersion
				}
			}
		};

		this.modifiedAfter = Date.now();
		this.path = `/no-auth/unsubscribe-weekly?t=${this.token}`;
		this.expectedPreferences = DeepClone(this.currentUser.user.preferences || {});
		Object.assign(this.expectedPreferences, { weeklyEmailDelivery: false, notifications: 'involveMe' });
		callback();
	}

	// perform the actual unsubscribe
	unsubscribeWeekly (callback) {
		this.doApiRequest(
			{
				method: 'get',
				path: this.path,
				requestOptions: {
					noJsonInResponse: true,
					expectRedirect: true
				}
			},
			callback
		);
	}
}

module.exports = CommonInit;
