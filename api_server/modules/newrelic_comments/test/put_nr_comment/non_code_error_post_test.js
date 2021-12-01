'use strict';

const UpdateNRCommentTest = require('./update_nr_comment_test');

class NonCodeErrorPostTest extends UpdateNRCommentTest {

	get description () {
		return 'should return an error when trying to update a post whose parent is not a code error';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009',
			reason: 'parent is not a code error'
		};
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			Object.assign(this.postOptions, {
				numPosts: 2,
				creatorIndex: 0,
				postData: [
					{
						creatorIndex: 1
					},
					{
						creatorIndex: 0,
						replyTo: 0
					}
				]
			});
			callback();
		});
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.path = '/nr-comments/' + this.postData[1].post.id;
			callback();
		});
	}
}

module.exports = NonCodeErrorPostTest;
