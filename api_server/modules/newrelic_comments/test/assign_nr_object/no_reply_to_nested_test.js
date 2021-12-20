'use strict';

const CreateNRCommentTest  = require('./create_nr_comment_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class NoReplyToNestedTest extends CreateNRCommentTest {

	get description () {
		return 'should return an error when trying to reply to an NR comment that is already a nested reply to another comment';
	}

	getExpectedError () {
		return {
			code: 'POST-1007',
			reason: 'the parent post is a reply to an object that does not match the object referenced in the submitted reply'
,		};
	}

	// before the test runs...
	before (callback) {
		// create an initial comment, then reply to that comment,
		// then we'll set the test to reply to that comment
		BoundAsync.series(this, [
			super.before,
			this.createNRComment,
			this.createReply,
			this.setParentPost
		], callback);
	}

	// create a reply to the original comment
	createReply (callback) {
		this.data = this.requestData;
		this.data.parentPostId = this.nrCommentResponse.post.id;
		this.createNRComment(callback);
	}

	// set the test comment to have the already-created reply as a parent
	setParentPost (callback) {
		this.data = this.requestData;
		this.data.parentPostId = this.nrCommentResponse.post.id;
		callback();
	}

}

module.exports = NoReplyToNestedTest;
