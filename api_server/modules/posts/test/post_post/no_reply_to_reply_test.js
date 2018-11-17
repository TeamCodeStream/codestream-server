'use strict';

const PostPostTest = require('./post_post_test');

class NoReplyToReplyTest extends PostPostTest {

	get description () {
		return 'should return an error when trying to reply to a post that is already a reply to another post';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			Object.assign(this.postOptions, {
				creatorIndex: 1,
				numPosts: 2,
				postData: [{}, { replyTo: 0 }]
			});
			callback();
		});
	}

	getExpectedError () {
		return {
			code: 'POST-1001'
		};
	}

	// form the data for the post we'll create in the test
	makePostData (callback) {
		super.makePostData(() => {
			// use the ID of the second post we created, as a reply to the first
			this.data.parentPostId = this.postData[1].post.id;
			callback();
		});
	}
}

module.exports = NoReplyToReplyTest;
