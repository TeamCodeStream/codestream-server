'use strict';

const PutCodemarkTest = require('./put_codemark_test');
const DefaultTags = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/teams/default_tags');
const RandomString = require('randomstring');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const UUID = require('uuid/v4');

class TagsTest extends PutCodemarkTest {

	get description () {
		return 'should return the updated codemark when updating a codemark with tags';
	}

	init (callback) {
		BoundAsync.series(this, [
			super.init,
			this.createTags,
			this.addTagsToCodemarkData
		], callback);
	}

	createTags (callback) {
		this.tags = [];
		BoundAsync.timesSeries(
			this,
			2,
			this.createTag,
			callback
		);
	}

	createTag (n, callback) {
		const tagId = UUID().split('-').join(''); 
		const tag = {
			id: tagId,
			color: RandomString.generate(8),
			label: RandomString.generate(20),
			sortOrder: Math.floor(Math.random(100))
		};
		this.tags.push(tag);
		this.doApiRequest(
			{
				method: 'post',
				path: '/team-tags/' + this.team.id,
				data: tag,
				token: this.users[1].accessToken
			},
			callback
		);
	}

	addTagsToCodemarkData (callback) {
		const tags = this.data.tags = [
			this.tags[0].id,
			Object.keys(DefaultTags)[2],
			Object.keys(DefaultTags)[4],
			this.tags[1].id
		];
		this.data.tags = [...tags];
		this.expectedData.codemark.$set.tags = [...tags];
		callback();
	}
}

module.exports = TagsTest;