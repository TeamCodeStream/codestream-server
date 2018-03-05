'use strict';

var SlackPostTest = require('./slack_post_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class ParentPostNoMatchStreamTest extends SlackPostTest {

	get description () {
		return 'should return an error when trying to send a slack post request with a parent post ID and a stream ID that are not related';
	}

	getExpectedError () {
		return {
			code: 'SLIN-1004',
		};
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,			// normal test setup
			this.createOtherStream,	// create another stream
			this.makePostData		// make the data to be used in the request that triggers the message
		], callback);
	}

	// create a second stream ... we'll use this stream for the slack post's parent,
	// even though we specifiy the original stream ... this is not allowed!
	createOtherStream (callback) {
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherStream = response.stream;
				callback();
			},
			{
				type: 'file',
				teamId: this.team._id,
				repoId: this.repo._id,
				token: this.token // "current user" will create the stream
			}
		);
	}

	// make the data to be used in the request that triggers the message
	makePostData (callback) {
		// this is called in the "normal" setup, but we need to wait till the "other stream" is created
		if (!this.otherStream) { return callback(); }
		super.makePostData(() => {
			// inject the other stream ID
			this.data.streamId = this.otherStream._id;
			callback();
		});
	}
}

module.exports = ParentPostNoMatchStreamTest;
