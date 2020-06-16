'use strict';

const TagsTest = require('./tags_test');

class DeactivatedDefaultTagTest extends TagsTest {

	get description () {
		return 'should return an error when attempting to create a codemark with a default tag that has been deactivated';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'tag'
		};
	}

	makeCodemarkData (callback) {
		super.makeCodemarkData(() => {
			this.doApiRequest(
				{
					method: 'delete',
					path: `/team-tags/${this.team.id}/${this.data.tags[2]}`,
					token: this.users[1].accessToken
				},
				callback
			);
		});
	}
}

module.exports = DeactivatedDefaultTagTest;
