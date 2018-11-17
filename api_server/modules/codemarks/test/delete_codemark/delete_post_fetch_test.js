'use strict';

const DeletePostTest = require('./delete_post_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Assert = require('assert');
const CodemarkTestConstants = require('../codemark_test_constants');

class DeletePostFetchTest extends DeletePostTest {

	get description () {
		return 'should delete associated post when a codemark is deleted, checked by fetching the post';
	}

	get method () {
		return 'get';
	}

	getExpectedFields () {
		return { post: CodemarkTestConstants.EXPECTED_POST_FIELDS };
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,	// do the usual test prep
			this.deleteCodemark,	// perform the actual deletion
			this.setPath
		], callback);
	}

	setPath (callback) {
		this.path = '/posts/' + this.postData[0].post.id;
		callback();
	}

	// validate that the response is correct
	validateResponse (data) {
		Assert(data.post.modifiedAt > this.modifiedAfter, 'modifiedAt is not greater than before the codemark was deleted');
		this.expectedPost.modifiedAt = data.post.modifiedAt;
		// verify what we fetch is what we got back in the response
		Assert.deepEqual(data.post, this.expectedPost, 'fetched post does not match');
	}
}

module.exports = DeletePostFetchTest;
