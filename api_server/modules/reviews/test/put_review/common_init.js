// base class for many tests of the "PUT /reviews" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');
const RandomString = require('randomstring');
const UUID = require('uuid/v4');

class CommonInit {

	init (callback) {
		this.expectedVersion = 2;
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.makeCustomTags,
			this.makeReviewUpdateData, // make the data to use when issuing the test request
		], callback);
	}

	// set options to use when running the test
	setTestOptions (callback) {
		this.teamOptions.creatorIndex = 1;
		this.streamOptions.creatorIndex = 1;
		this.userOptions.numRegistered = 3;
		this.repoOptions.creatorIndex = 1;
		this.repoOptions.numRepos = 2;
		if (this.streamType === 'team stream') {
			Object.assign(this.streamOptions, {
				type: 'channel',
				isTeamStream: true
			});
		}
		else {
			this.streamOptions.type = this.streamType || 'channel';
		}
		Object.assign(this.postOptions, {
			creatorIndex: 0,
			wantReview: true,
			wantMarkers: 2
		});
		callback();
	}

	// make custom tags for the team as needed
	makeCustomTags (callback) {
		if (!this.wantCustomTags) { return callback(); }
		this.tagIds = [];
		BoundAsync.timesSeries(
			this, 
			2,
			this.makeCustomTag,
			callback
		);
	}

	// add a custom tag for the team, to be added to the review unless a default tag is desired
	makeCustomTag (n, callback) {
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

	// get the data to use when issuing the test request	
	getReviewUpdateData () {
		const data = {
			title: RandomString.generate(100),
			text: RandomString.generate(100)
		};
		return data;
	}

	// make the data to use when issuing the test request
	makeReviewUpdateData (callback) {
		this.review = this.postData[0].review;
		this.data = this.getReviewUpdateData();
		this.expectedData = {
			review: {
				_id: this.review.id,	// DEPRECATE ME
				id: this.review.id,
				$set: Object.assign(DeepClone(this.data), {
					version: this.expectedVersion,
					modifiedAt: Date.now() // placeholder
				}),
				$version: {
					before: this.expectedVersion - 1,
					after: this.expectedVersion
				}
			}
		};
		this.expectedReview = DeepClone(this.review);
		Object.assign(this.expectedReview, this.expectedData.review.$set);
		this.modifiedAfter = Date.now();
		this.path = '/reviews/' + this.review.id;
		callback();
	}

	// perform the actual update 
	updateReview (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/reviews/' + this.review.id,
				data: this.data,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.requestData = this.data;
				this.message = response;
				delete this.data;	// don't need this anymore
				callback();
			}
		);
	}
}

module.exports = CommonInit;
