// base class for many tests of the "PUT /read-item/:postId" requests

'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class CommonInit {

	init (callback) {
		this.streamOptions.creatorIndex = 1;
		Object.assign(this.postOptions, {
			numPosts: 1,
			creatorIndex: 1,
			wantCodemark: 1,
			wantMarker: 1
		});
		BoundAsync.series(this, [
			CodeStreamAPITest.prototype.before.bind(this),
			this.setExpectedData
		], callback);
	}

	setExpectedData (callback) {
		this.numReplies = 3;
		this.data = { numReplies: this.numReplies };
		this.expectedData = {
			user: {
				_id: this.currentUser.user.id,	// DEPRECATE ME
				id: this.currentUser.user.id,
				$set: {
					[`lastReadItems.${this.postData[0].post.id}`]: this.numReplies,
					version: 6
				},
				$version: {
					before: 5,
					after: 6
				}
			}
		};
		callback();
	}

	setItemRead (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/read-item/' + this.postData[0].post.id,
				data: this.data,
				token: this.token
			},
			callback
		);
	}
}

module.exports = CommonInit;
