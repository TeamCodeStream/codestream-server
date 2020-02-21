'use strict';

const AddTagTest = require('./add_tag_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Assert = require('assert');

class FetchTest extends AddTagTest {

	get description () {
		return 'should properly add a tag to the review tags when requested, checked by fetching the review';
	}

	run (callback) {
		// run the main test, then fetch the review afterwards
		BoundAsync.series(this, [
			super.run,
			this.fetchReview
		], callback);
	}

	// fetch the review, and verify it has the expected tags
	fetchReview (callback) {
		this.doApiRequest(
			{
				method: 'get',
				path: '/reviews/' + this.review.id,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				const expectedTags = [];
				if (this.expectOtherTag) {
					expectedTags.push(this.otherTagId);
				}
				expectedTags.push(this.tagId);
				Assert.deepEqual(response.review.tags, expectedTags, 'fetched review does not have the correct tags');
				callback();
			}
		);
	}
}

module.exports = FetchTest;
