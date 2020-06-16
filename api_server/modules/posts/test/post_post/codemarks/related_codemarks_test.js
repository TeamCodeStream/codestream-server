'use strict';

const CodemarkMarkerTest = require('./codemark_marker_test');
const Assert = require('assert');
const RandomString = require('randomstring');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class RelatedCodemarksTest extends CodemarkMarkerTest {

	constructor (options) {
		super(options);
		this.expectedRepoVersion = 5;
	}
	
	get description () {
		return 'should allow related codemarks when creating a post with codemark info, and should update the related codemarks to be related to the created codemark';
	}

	makePostData (callback) {
		// after generate codemark data, create some codemarks that will be related
		BoundAsync.series(this, [
			super.makePostData,
			this.createRelatedCodemarks			
		], callback);
	}

	// create several codemarks to be related to the codemark created during the test
	createRelatedCodemarks (callback) {
		this.data.codemark.relatedCodemarkIds = [];
		BoundAsync.timesSeries(
			this,
			3,
			this.createRelatedCodemark,
			callback
		);
	}

	// create a single codemark to be related to the codemark created during the test
	createRelatedCodemark (n, callback) {
		const codemarkData = this.codemarkFactory.getRandomCodemarkData();
		Object.assign(codemarkData, {
			teamId: this.team.id,
			providerType: RandomString.generate(10),
			streamId: RandomString.generate(10),
			postId: RandomString.generate(10)
		});
		codemarkData.markers = this.markerFactory.createRandomMarkers(1, { fileStreamId: this.repoStreams[0].id });
		this.doApiRequest(
			{
				method: 'post',
				path: '/codemarks',
				data: codemarkData,
				token: this.users[1].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.data.codemark.relatedCodemarkIds.push(response.codemark.id);
				callback();
			}
		);
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.deepEqual(data.codemark.relatedCodemarkIds, this.data.codemark.relatedCodemarkIds, 'relatedCodemarkIds should be equal to the related codemarks provided');
		for (let relatedCodemarkId of this.data.codemark.relatedCodemarkIds) {
			const updatedCodemark = data.codemarks.find(updatedCodemark => {
				return updatedCodemark.id === relatedCodemarkId;
			});
			Assert(updatedCodemark, 'related codemark not found to be updated');
			Assert(updatedCodemark.$set.modifiedAt >= data.post.createdAt - 500);

			const expectedOp = {
				id: relatedCodemarkId,
				_id: relatedCodemarkId,	// DEPRECATE ME
				$addToSet: {
					relatedCodemarkIds: data.codemark.id
				},
				$set: {
					version: 2,
					modifiedAt: updatedCodemark.$set.modifiedAt
				},
				$version: {
					before: 1,
					after: 2
				}
			};
			Assert.deepEqual(updatedCodemark, expectedOp, 'related codemark not properly updated');
		}
		super.validateResponse(data);
	}
}

module.exports = RelatedCodemarksTest;
