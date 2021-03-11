// base class for many tests of the "PUT /unread/:postId" requests

'use strict';

const TestStreamCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/test_stream_creator');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');

class CommonInit {

	init (callback) {
		this.teamOptions.creatorIndex = 1;
		//this.streamOptions.creatorIndex = 1;
		this.postOptions.creatorIndex = 1;
		BoundAsync.series(this, [
			CodeStreamAPITest.prototype.before.bind(this),
			//this.createOtherStream,
			this.setExpectedData
		], callback);
	}

	// create a second stream and post
	createOtherStream (callback) {
		const options = {
			...this.streamOptions,
			creatorIndex: 1
		};
		new TestStreamCreator({
			test: this,
			team: this.team,
			users: this.users,
			streamOptions: options,
			postOptions: this.postOptions
		}).create((error, data) => {
			if (error) { return callback(error); }
			this.otherStream = data.stream;
			this.otherPostData = data.postData;
			callback();
		});
	}

	setExpectedData (callback) {
		this.expectedData = {
			user: {
				_id: this.currentUser.user.id,	// DEPRECATE ME
				id: this.currentUser.user.id,
				$set: {
					version: 4
				},
				$unset: {
					[`lastReads.${this.teamStream.id}`]: true,
				},
				$version: {
					before: 3,
					after: 4
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
