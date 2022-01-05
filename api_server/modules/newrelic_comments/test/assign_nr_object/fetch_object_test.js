'use strict';

const AssignNRObjectTest = require('./assign_nr_object_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class FetchObjectTest extends AssignNRObjectTest {

	get description () {
		return 'should create a New Relic object (code error) and post as parent when assigning a user to a New Relic object, checked by fetching the code error';
	}

	get method () {
		return 'get';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createNRAssignment,
			this.setPath,
			this.claimCodeError,
			this.inviteAndRegisterFauxUser
		], callback);
	}

	setPath (callback) {
		this.path = `/posts/${this.nrAssignmentResponse.codeStreamResponse.post.id}`;
		callback();
	}

	// validate that the response is correct
	validateResponse (data) {
		const { post, codeError } = data;
		Assert.equal(post.id, this.nrAssignmentResponse.codeStreamResponse.post.id, 'fetched post is not the parent of the comment created');
		Assert.equal(post.codeErrorId, codeError.id, 'fetched post does not point to the created code error');
		Assert.equal(codeError.postId, post.id, 'fetched code error does not point to the created post');
	}
}

module.exports = FetchObjectTest;
