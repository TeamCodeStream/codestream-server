'use strict';

const TagsTest = require('./tags_test');

class DeactivatedTagTest extends TagsTest {

	get description () {
		return 'should return an error when attempting to create a post with a codemark with a tag that has been deactivated';
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
					path: `/team-tags/${this.team.id}/${this.data.codemark.tags[3]}`,
					token: this.users[1].accessToken
				},
				callback
			);
		});
	}
}

module.exports = DeactivatedTagTest;
