// base class for many tests of the "PUT /reviews/:id/add-tag" requests

'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const DeepClone = require(process.env.CS_API_TOP + '/server_utils/deep_clone');
const RandomString = require('randomstring');
const UUID = require('uuid/v4');

class CommonInit {

	init (callback) {
		this.teamOptions.creatorIndex = 1;
		this.streamOptions.creatorIndex = 1;
		Object.assign(this.postOptions, {
			creatorIndex: 1,
			wantReview: true,
			wantMarkers: 2
		});
		BoundAsync.series(this, [
			CodeStreamAPITest.prototype.before.bind(this),
			this.addCustomTags,		// add a couple of custom tag for the team
			this.makeTestData		// make the data to use when issuing the test request
		], callback);
	}

	// add a couple of custom tags for the team
	addCustomTags (callback) {
		this.tagIds = [];
		BoundAsync.timesSeries(
			this, 
			2,
			this.addCustomTag,
			callback
		);
	}

	// add a custom tag for the team, to be added to the review unless a default tag is desired
	addCustomTag (n, callback) {
		const tagId = UUID().split('-').join('');
		this.doApiRequest(
			{
				method: 'post',
				path: '/team-tags/' + this.team.id,
				data: {
					id: tagId,
					color: RandomString.generate(8),
					label: RandomString.generate(10),
					sortOrder: Math.floor(Math.random(100))
				},
				token: this.users[1].accessToken
			},
			error => {
				if (error) { return callback(error); }
				this.tagIds.push(tagId);
				if (n === 0 && !this.tagId) {
					this.tagId = tagId;
				}
				else if (n === 1) {
					this.otherTagId = tagId;
				}
				callback();
			}
		);
	}

	// make the data to use when issuing the test request
	makeTestData (callback) {
		this.review = this.postData[0].review;
		this.expectedResponse = {
			review: {
				_id: this.review.id,	// DEPRECATE ME
				id: this.review.id,
				$set: {
					version: this.expectedVersion,
					modifiedAt: Date.now() // placeholder
				},
				$addToSet: {
					tags: this.tagId
				},
				$version: {
					before: this.expectedVersion - 1,
					after: this.expectedVersion
				}

			}
		};
		this.modifiedAfter = Date.now();
		this.path = `/reviews/${this.review.id}/add-tag`;
		this.data = {
			tagId: this.tagId
		};
		this.expectedReview = DeepClone(this.review);
		this.expectedReview.tags = this.expectedReview.tags || [];
		this.expectedReview.tags.push(this.tagId);
		callback();
	}

	// perform the actual tag add
	addTag (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: `/reviews/${this.review.id}/add-tag`,
				data: {
					tagId: this.tagId
				},
				token: this.users[1].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.message = response;
				callback();
			}
		);
	}
}

module.exports = CommonInit;
