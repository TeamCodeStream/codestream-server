'use strict';

const ReviewTest = require('./review_test');
const RandomString = require('randomstring');
const UUID = require('uuid').v4;
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const DefaultTags = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/teams/default_tags');
const Assert = require('assert');

class ReviewTagsTest extends ReviewTest {

	get description () {
		return 'should return a valid post and review when creating a post with a review with tags';
	}

	makePostData (callback) {
		BoundAsync.series(this, [
			super.makePostData,
			this.createTags,
			this.addTagsToReviewData
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

	addTagsToReviewData (callback) {
		this.data.review.tags = [
			this.tags[0].id,
			Object.keys(DefaultTags)[2],
			Object.keys(DefaultTags)[4],
			this.tags[1].id
		];
		callback();
	}

	validateResponse (data) {
		Assert.deepEqual(data.review.tags, this.data.review.tags, 'review not created with expected tags');
		super.validateResponse(data);
	}
}

module.exports = ReviewTagsTest;
