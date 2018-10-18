'use strict';

const PostPostTest = require('./post_post_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class StreamOnTheFlySeqNumTest extends PostPostTest {

	constructor (options) {
		super(options);
		this.expectedSeqNum = 2;	// the test will be to create the second post, it should have a seqNum of 2
	}

	get description () {
		return 'the second post created in a stream that was created on-the-fly with the first post should get a seqNum of 2';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.repoOptions.creatorIndex = 1;
			callback();
		});
	}

	// form the data for the post we'll create in the test
	makePostData (callback) {
		BoundAsync.series(this, [
			this.getStreamData,		// get some random stream data to use when creating a stream on the fly
			this.createPostAndStream,	// create a post with a stream on the fly
			super.makePostData,		// now form the actual post data
			this.setStreamId		// update the stream ID for the post to be created
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
				type: 'channel',
				memberIds: [this.currentUser.user._id]
			}
		);
	}

	// create a post with a stream on the fly
	createPostAndStream (callback) {
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.streamCreatedOnTheFly = response.streams[0];
				callback();
			},
			{
				stream: this.streamData,	// the stream data for an on-the-fly stream
				token: this.users[1].accessToken	// let's have the other user create the first post
			}
		);
	}

	setStreamId (callback) {
		this.data.streamId = this.streamCreatedOnTheFly._id;
		callback();
	}

	// verify we got the expected stream update in the response
	validateStreamUpdate (data) {
		// for purposes of this validatation, we created a stream on the fly earlier, 
		// this is the stream against which the stream update should be validated
		const tempStream = this.stream;
		this.stream = this.streamCreatedOnTheFly;
		super.validateStreamUpdate(data);
		this.stream = tempStream;
	}
}

module.exports = StreamOnTheFlySeqNumTest;
