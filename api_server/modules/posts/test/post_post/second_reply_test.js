'use strict';

const PostReplyTest = require('./post_reply_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class SecondReplyTest extends PostReplyTest {

	get description () {
		return 'parent post should get numReplies incremented when a second reply is created for that post';
	}

	// run the test...
	run (callback) {
		BoundAsync.series(this, [
			super.run,	// this posts the reply and checks the result, but then...
			this.createSecondReply,	// create another reply
			this.checkParentPost	// ...we'll check the parent post as well
		], callback);
	}

	// create a second repy, to test that numReplies gets incremented even if hasReplies is set
	createSecondReply (callback) {
		this.postFactory.createRandomPost(
			callback,
			{
				streamId: this.teamStream.id,
				token: this.users[1].accessToken,
				parentPostId: this.postData[0].post.id
			}
		);
	}

	// check the parent post for hasReplies being set
	checkParentPost (callback) {
		// get the marker 
		this.doApiRequest(
			{
				method: 'get',
				path: '/posts/' + this.postData[0].post.id,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				// confirm the numReplies attribute has been increments ... again
				Assert.equal(response.post.numReplies, 2, 'numReplies is not set to 2');
				callback();
			}
		);
	}
}

module.exports = SecondReplyTest;
