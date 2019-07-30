'use strict';

const FetchTest = require('./fetch_test');

class RemoveFromOtherTagFetchTest extends FetchTest {

	get description () {
		return 'should be ok to remove a tag from a codemark that already has another tag, checked by fetching the codemark';
	}

	init (callback) {
		this.expectOtherTag = true;
		this.expectedVersion = 3;

		// after initializing, add a different tag to the codemark
		super.init(error => {
			if (error) { return callback(error); }
			this.doApiRequest(
				{
					method: 'put',
					path: `/codemarks/${this.codemark.id}/add-tag`,
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

module.exports = RemoveFromOtherTagFetchTest;
