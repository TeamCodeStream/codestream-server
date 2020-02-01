'use strict';

const ReviewTagsTest = require('./review_tags_test');

class ReviewDeactivatedDefaultTagTest extends ReviewTagsTest {

	get description () {
		return 'should return an error when attempting to create a post with a review with a default tag that has been deactivated';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'tag'
		};
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.doApiRequest(
				{
					method: 'delete',
					path: `/team-tags/${this.team.id}/${this.data.review.tags[2]}`,
					token: this.users[1].accessToken
				},
				callback
			);
		});
	}
}

module.exports = ReviewDeactivatedDefaultTagTest;
