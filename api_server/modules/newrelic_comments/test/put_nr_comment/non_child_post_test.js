'use strict';

const UpdateNRCommentTest = require('./update_nr_comment_test');

class NonChildPostTest extends UpdateNRCommentTest {

	get description () {
		return 'should return an error when trying to update a non-child post through the comment engine';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009',
			reason: 'unable to fetch non-child post'
		};
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.postOptions.creatorIndex = 1;
			callback();
		});
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.path = '/nr-comments/' + this.postData[0].post.id;
			callback();
		});
	}
}

module.exports = NonChildPostTest;
