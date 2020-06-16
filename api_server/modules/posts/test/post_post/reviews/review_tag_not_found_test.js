'use strict';

const ReviewTagsTest = require('./review_tags_test');
const UUID = require('uuid/v4');

class ReviewTagNotFoundTest extends ReviewTagsTest {

	get description () {
		return 'should return an error when attempting to create a post with a review with a tag that is not known to the team';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'tag'
		};
	}

	makePostData (callback) {
		super.makePostData(() => {
			// substitute a non-existent tag
			this.data.review.tags[2] = UUID().split('-').join('');
			callback();
		});
	}
}

module.exports = ReviewTagNotFoundTest;
