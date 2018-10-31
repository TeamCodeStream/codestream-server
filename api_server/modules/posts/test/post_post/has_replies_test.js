'use strict';

const PostReplyTest = require('./post_reply_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Assert = require('assert');

class HasRepliesTest extends PostReplyTest {

	get description () {
		return 'parent post should get hasReplies set when the first reply is created for that post';
	}

	// run the test...
	run (callback) {
		BoundAsync.series(this, [
			super.run,	// this posts the reply and checks the result, but then...
			this.checkParentPost	// ...we'll check the parent post as well
		], callback);
	}

	// check the parent post for hasReplies being set
	checkParentPost (callback) {
		// get the marker 
		this.doApiRequest(
			{
				method: 'get',
				path: '/posts/' + this.postData[0].post._id,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				// confirm the hasReplies attribute has been set
				Assert.equal(response.post.hasReplies, true, 'hasReplies is not set to true');
				Assert.equal(response.post.numReplies, 1, 'numReplies is not set to 1');
				callback();
			}
		);
	}
}

module.exports = HasRepliesTest;
