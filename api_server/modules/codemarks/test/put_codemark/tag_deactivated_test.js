'use strict';

const TagsTest = require('./tags_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class TagDeactivatedTest extends TagsTest {

	get description () {
		return 'should return an error when trying to update a codemark with tags that have been deactivated';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'tag'
		};
	}

	init (callback) {
		BoundAsync.series(this, [
			super.init,
			this.deactivateTag
		], callback);
	}

	deactivateTag (callback) {
		this.doApiRequest(
			{
				method: 'delete',
				path: `/team-tags/${this.team.id}/${this.data.tags[3]}`,
				token: this.users[1].accessToken
			},
			callback
		);
	}
}

module.exports = TagDeactivatedTest;
