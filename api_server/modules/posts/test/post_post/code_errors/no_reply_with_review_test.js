'use strict';

const ReviewTest = require('./review_test');

class NoReplyWithReviewTest extends ReviewTest {

	constructor (options) {
		super(options);
		this.postOptions.numPosts = 1;
		this.postOptions.creatorIndex = 1;
	}

	get description () {
		return 'should return an error if a reply is sent with review info';
	}

	getExpectedError () {
		return {
			code: 'POST-1003'
		};
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.data.parentPostId = this.postData[0].post.id;
			callback();
		});
	}
}

module.exports = NoReplyWithReviewTest;
