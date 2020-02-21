'use strict';

const AddTagTest = require('./add_tag_test');

class DeactivatedTagTest extends AddTagTest {

	get description () {
		return 'should return an error when trying to add a tag that has been deactivated to a review';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'tag'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			// deactivate the tag
			this.doApiRequest(
				{
					method: 'delete',
					path: `/team-tags/${this.team.id}/${this.tagId}`,
					token: this.users[1].accessToken
				},
				callback
			);
		});
	}
}

module.exports = DeactivatedTagTest;
