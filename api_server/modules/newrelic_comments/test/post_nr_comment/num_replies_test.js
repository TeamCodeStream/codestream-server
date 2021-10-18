'use strict';

const NestedCommentTest = require('./nested_comment_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class NumRepliesTest extends NestedCommentTest {

	get description () {
		return 'parent post of an NR comment should get numReplies incremented when a reply is created for that comment';
	}

	// run the test...
	run (callback) {
		BoundAsync.series(this, [
			super.run,	// this posts the reply and checks the result, but then...
			this.claimCodeError, // claim the code error for the team
			this.inviteAndRegisterFauxUser, 	// need to register to read the post
			this.checkParentPost	// ...we'll check the parent post as well
		], callback);
	}

	// check the parent post for hasReplies being set
	checkParentPost (callback) {
		this.doApiRequest(
			{
				method: 'get',
				path: '/posts/' + this.nrCommentResponse.post.id,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				// confirm the numReplies attribute has been incremented
				Assert.equal(response.post.numReplies, 1, 'numReplies is not set to 1');
				callback();
			}
		);
	}
}

module.exports = NumRepliesTest;
