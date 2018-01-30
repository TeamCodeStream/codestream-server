'use strict';

var PostPostTest = require('./post_post_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class StreamOnTheFlySeqNumTest extends PostPostTest {

	constructor (options) {
		super(options);
		this.testOptions.expectedSeqNum = 2;	// the test will be to create the second post, it should have a seqNum of 2
	}

	get description () {
		return 'the second post created in a stream that was created on-the-fly with the first post should get a seqNum of 2';
	}

	// form the data for the post we'll create in the test
	makePostData (callback) {
		BoundAsync.series(this, [
			this.getStreamData,		// get some random stream data to use when creating a stream on the fly
			this.createPostAndStream,	// create a post with a stream on the fly
			super.makePostData		// now form the actual post data
		], callback);
	}

	// get some random stream data to use when creating a post on the fly
	getStreamData (callback) {
		this.streamFactory.getRandomStreamData(
			(error, data) => {
				if (error) { return callback(error); }
				this.streamData = data;
				callback();
			},
			{
				teamId: this.team._id,
				repoId: this.repo._id,
				type: 'file'
			}
		);
	}

	// create a post with a stream on the fly
	createPostAndStream (callback) {
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.postOptions = {
					streamId: response.stream._id
				};
				callback();
			},
			{
				stream: this.streamData,	// the stream data for an on-the-fly stream
				token: this.otherUserData.accessToken	// let's have the other user create the first post
			}
		);
	}
}

module.exports = StreamOnTheFlySeqNumTest;
