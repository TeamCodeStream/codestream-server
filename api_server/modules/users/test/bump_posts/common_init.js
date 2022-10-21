// base class for many tests of the "PUT /bump-posts" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');

class CommonInit {

	init (callback) {
		this.teamOptions.creatorIndex = 1;
		//this.streamOptions.creatorIndex = 1;
		this.postOptions.numPosts = 3;
		this.numAuthoredPosts = 2;
		this.postOptions.creatorIndex = [1, 0, 0];
		BoundAsync.series(this, [
			CodeStreamAPITest.prototype.before.bind(this),
			this.setExpectedData
		], callback);
	}

	setExpectedData (callback) {
		const expectedVersion = this.currentUser.user.version + this.numAuthoredPosts + 1;
		this.expectedData = {
			user: {
				_id: this.currentUser.user.id,	// DEPRECATE ME
				id: this.currentUser.user.id,
				$set: {
					totalPosts: this.numAuthoredPosts + 1,
					version: expectedVersion
				},
				$version: {
					before: expectedVersion - 1,
					after: expectedVersion
				}
			}
		};
		callback();
	}

	// do the test request of bumping posts count
	bumpPosts (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/bump-posts',
				token: this.token
			},
			callback
		);
	}
}

module.exports = CommonInit;
