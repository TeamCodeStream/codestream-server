'use strict';

const GetPostsTest = require('./get_posts_test');
const Assert = require('assert');

class GetPostsWithCodeMarksTest extends GetPostsTest {

	constructor (options) {
		super(options);
		this.postOptions.wantCodeMark = true;
	}

	get description () {
		return 'should return the correct posts with codemarks when requesting posts created with knowledge base codemark attachments';
	}

	// validate the response to the fetch request
	validateResponse (data) {
		data.posts.forEach(post => {
			const codemark = data.codemarks.find(codemark => codemark._id === post.codemarkId);
			Assert(codemark, 'codemark not returned with post');
		});
		super.validateResponse(data);
	}
}

module.exports = GetPostsWithCodeMarksTest;
