'use strict';

const GetCodemarksTest = require('./get_codemarks_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class GetCodemarksByStreamIdTest extends GetCodemarksTest {

	get description () {
		return 'should return the correct codemarks when requesting codemarks for a team and by stream ID';
	}


	setPath (callback) {
		// set path, but create another stream with some more posts, and make sure we don't see
		// any of those posts
		BoundAsync.series(this, [
			super.setPath,
			this.createOtherStream,
			this.createOtherPosts,
		], callback);
	}

	createOtherStream (callback) {
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherStream = response.stream;
				this.path = `/codemarks?teamId=${this.team._id}&streamId=${this.stream._id}`;
				callback();
			},
			{
				teamId: this.team._id,
				type: 'channel',
				token: this.users[1].accessToken
			}
		);
	}

	createOtherPosts (callback) {
		BoundAsync.timesSeries(
			this,
			5,
			this.createOtherPost,
			callback
		);
	}

	createOtherPost (n, callback) {
		this.postFactory.createRandomPost(
			callback,
			{
				streamId: this.otherStream._id,
				token: this.users[1].accessToken,
				wantCodemark: true
			}
		);
	}
	
	// validate correct response
	validateResponse (data) {
		data.codemarks.forEach(codemark => {
			Assert.equal(codemark.streamId, this.stream._id, 'got a codemark with non-matching stream ID');
		});
		super.validateResponse(data);
	}
}

module.exports = GetCodemarksByStreamIdTest;
