// base class for many tests of the "POST /posts" requests to create a new post

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');

class CommonInit {

	init (callback) {
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.makePostData
		], callback);
	}
	
	setTestOptions (callback) {
		this.teamOptions.creatorIndex = 1;
		this.streamOptions.creatorIndex = 1;
		callback();
	}

	// form the data for the post we'll create in the test
	makePostData (callback) {
		this.postCreatedAfter = Date.now();
		this.postFactory.getRandomPostData(
			(error, data) => {
				if (error) { return callback(error); }
				this.data = data;
				callback();
			},
			{
				streamId: this.stream.id
			}
		);
	}
	
	// set the current user's preference for notifications
	setNotificationPreference (preference, userIndex, callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/preferences',
				data: {
					notifications: preference
				},
				token: this.users[userIndex].accessToken
			},
			callback
		);
	}
}

module.exports = CommonInit;
