// base class for many tests of the "PUT /unread/:postId" requests

'use strict';

const TestStreamCreator = require(process.env.CS_API_TOP + '/lib/test_base/test_stream_creator');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');

class CommonInit {

	init (callback) {
		this.teamOptions.creatorIndex = 1;
		this.teamOptions.inviterIndex = 1;
		this.streamOptions.creatorIndex = 1;
		this.postOptions.creatorIndex = 1;
		BoundAsync.series(this, [
			CodeStreamAPITest.prototype.before.bind(this),
			this.createOtherStream,
			this.setExpectedData
		], callback);
	}

	// create a second stream and post
	createOtherStream (callback) {
		new TestStreamCreator({
			test: this,
			team: this.team,
			users: this.users,
			streamOptions: this.streamOptions,
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
				_id: this.currentUser.user._id,
				$set: {
					version: 4
				},
				$unset: {
					[`lastReads.${this.stream._id}`]: true,
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
				path: '/read/' + this.stream._id,
				token: this.token
			},
			callback
		);
	}
}

module.exports = CommonInit;
