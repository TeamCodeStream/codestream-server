'use strict';

const CreateNRCommentTest = require('./create_nr_comment_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class NestedCommentTest extends CreateNRCommentTest {

	get description () {
		return 'should return the expected response when a request is made to create a New Relic comment as a reply to an existing comment';
	}

	// before the test runs...
	before (callback) {
		// create an initial comment, then we'll set the test to reply to that comment
		BoundAsync.series(this, [
			super.before,
			this.createNRComment,
			this.setParentPost
		], callback);
	}

	// set the test comment to have the already-created comment as a parent
	setParentPost (callback) {
		this.data = this.requestData;
		this.data.parentPostId = this.nrCommentResponse.post.id;
		this.expectedParentPostId = this.data.parentPostId;
		this.expectedResponse.post.seqNum++;
		callback();
	}
}

module.exports = NestedCommentTest;
