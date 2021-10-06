'use strict';

const GetPostsTest = require('./get_posts_test');
const Assert = require('assert');

class GetPostsWithCodeErrorsTest extends GetPostsTest {

	constructor (options) {
		super(options);
		this.postOptions.wantCodeError = true;
		this.postOptions.creatorIndex = 0;
	}

	get description () {
		return 'should return the correct posts with code errors when requesting posts created with code errors';
	}

	setPath (callback) {
		super.setPath(() => {
			this.path += `&includeFollowed=1`;
			callback();
		});
	}

	// validate the response to the fetch request
	validateResponse (data) {
		data.posts.forEach(post => {
			const codeError = data.codeErrors.find(codeError => codeError.id === post.codeErrorId);
			Assert(codeError, 'code error not returned with post');
		});
		super.validateResponse(data);
	}
}

module.exports = GetPostsWithCodeErrorsTest;
