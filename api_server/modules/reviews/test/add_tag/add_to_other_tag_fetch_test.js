'use strict';

const FetchTest = require('./fetch_test');

class AddToOtherTagFetchTest extends FetchTest {

	get description () {
		return 'should be ok to add a tag to a review that already has at least one tag, checked by fetching the review';
	}

	init (callback) {
		this.expectOtherTag = true;
		this.expectedVersion = 3;

		// after initializing, add a different tag to the review
		super.init(error => {
			if (error) { return callback(error); }
			this.doApiRequest(
				{
					method: 'put',
					path: `/reviews/${this.review.id}/add-tag`,
					data: {
						tagId: this.otherTagId
					},
					token: this.users[1].accessToken
				},
				callback
			);
		});
	}
}

module.exports = AddToOtherTagFetchTest;
