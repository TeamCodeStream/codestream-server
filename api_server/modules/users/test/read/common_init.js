// base class for many tests of the "PUT /unread/:postId" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');

class CommonInit {

	init (callback) {
		this.teamOptions.creatorIndex = 1;
		this.postOptions.creatorIndex = 1;
		BoundAsync.series(this, [
			CodeStreamAPITest.prototype.before.bind(this),
			this.setExpectedData
		], callback);
	}

	setExpectedData (callback) {
		const expectedVersion = this.currentUser.user.version + 1;
		this.expectedData = {
			user: {
				_id: this.currentUser.user.id,	// DEPRECATE ME
				id: this.currentUser.user.id,
				$set: {
					version: expectedVersion
				},
				$unset: {
					[`lastReads.${this.teamStream.id}`]: true,
				},
				$version: {
					before: expectedVersion - 1,
					after: expectedVersion
				}
			}
		};
		callback();
	}

	// mark the first stream as read
	markRead (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/read/' + this.teamStream.id,
				token: this.token
			},
			callback
		);
	}
}

module.exports = CommonInit;
