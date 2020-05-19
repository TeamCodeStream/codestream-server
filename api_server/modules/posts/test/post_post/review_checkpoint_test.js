'use strict';

const PostPostTest = require('./post_post_test');
const Assert = require('assert');

class ReviewCheckpointTest extends PostPostTest {

	get description () {
		return 'should be able to provide reviewCheckpoint with a post';
	}

	makePostData (callback) {
		super.makePostData(error => {
			if (error) { return callback(error); }
			this.data.reviewCheckpoint = 1;
			callback();
		});
	}

	validateResponse (data) {
		Assert.equal(data.post.reviewCheckpoint, this.data.reviewCheckpoint, 'reviewCheckpoint not part of response');
		super.validateResponse(data);
	}
}

module.exports = ReviewCheckpointTest;
