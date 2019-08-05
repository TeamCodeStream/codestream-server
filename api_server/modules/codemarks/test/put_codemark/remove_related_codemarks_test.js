'use strict';

const PutCodemarkTest = require('./put_codemark_test');
const Assert = require('assert');
const RandomString = require('randomstring');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class RemoveRelatedCodemarksTest extends PutCodemarkTest {

	constructor (options) {
		super(options);
		this.goPostless = true;
	}

	get description () {
		return 'should allow related codemarks to be removed when updating a codemark, and should update the related codemarks to be unrelated from the updated codemark';
	}

	// override making the postless codemark, to create some codemarks first, and then relate those,
	// so they are "pre-related" to the codemark when we do the test
	makePostlessCodemark (callback) {
		this.data = { relatedCodemarkIds: [] };
		BoundAsync.series(this, [
			this.createPrerelatedCodemarks,
			super.makePostlessCodemark
		], callback);
	}

	// add the codemarks we have already created to the list of related codemarks for the test codemark to be created
	getPostlessCodemarkData () {
		const data = super.getPostlessCodemarkData();
		data.relatedCodemarkIds = this.prerelatedCodemarkIds;
		return data;
	}
		
	// create several codemarks to be related to the codemark to be updated during the test
	createPrerelatedCodemarks (callback) {
		this.prerelatedCodemarkIds = [];
		BoundAsync.timesSeries(
			this,
			4,
			this.createPrerelatedCodemark,
			callback
		);
	}

	// create a single codemark to be related to the codemark created during the test
	createPrerelatedCodemark (n, callback) {
		const codemarkData = this.codemarkFactory.getRandomCodemarkData();
		Object.assign(codemarkData, {
			teamId: this.team.id,
			providerType: RandomString.generate(10),
			streamId: RandomString.generate(10),
			postId: RandomString.generate(10)
		});
		codemarkData.markers = [this.markerFactory.getRandomMarkerData()];
		this.doApiRequest(
			{
				method: 'post',
				path: '/codemarks',
				data: codemarkData,
				token: this.users[1].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.prerelatedCodemarkIds.push(response.codemark.id);
				callback();
			}
		);
	}

	makeCodemarkUpdateData (callback) {
		// after generate codemark data, create some codemarks that will be related
		BoundAsync.series(this, [
			super.makeCodemarkUpdateData,
			this.adjustExpectedData		
		], callback);
	}

	// adjust the expected response data to reflect the related codemarks
	adjustExpectedData (callback) {
		this.data.relatedCodemarkIds = [this.prerelatedCodemarkIds[1], this.prerelatedCodemarkIds[3]];
		this.removedCodemarkIds = [this.prerelatedCodemarkIds[0], this.prerelatedCodemarkIds[2]];
		this.expectedData.codemark.$set.relatedCodemarkIds = [...this.data.relatedCodemarkIds];
		this.expectedData.codemarks = this.removedCodemarkIds.map(unrelatedCodemarkId => {
			return {
				id: unrelatedCodemarkId,
				_id: unrelatedCodemarkId,
				$pull: {
					relatedCodemarkIds: this.codemark.id
				},
				$set: {
					modifiedAt: Date.now(),	// placeholder
					version: 3
				},
				$version: {
					before: 2,
					after: 3
				}
			};
		});
		this.expectedCodemark.relatedCodemarkIds = [...this.data.relatedCodemarkIds];
		callback();
	}

	// validate the response to the test request
	validateResponse (data) {
		for (let unrelatedCodemarkId of this.removedCodemarkIds) {
			const updatedCodemark = data.codemarks.find(updatedCodemark => {
				return updatedCodemark.id === unrelatedCodemarkId;
			});
			Assert(updatedCodemark, 'unrelated codemark not found to be updated');
			Assert(updatedCodemark.$set.modifiedAt >= this.modifiedAfter, 'modifiedAt not properly set for related codemark');
			const expectedCodemark = this.expectedData.codemarks.find(expectedCodemark => {
				return expectedCodemark.id === unrelatedCodemarkId;
			});
			expectedCodemark.$set.modifiedAt = updatedCodemark.$set.modifiedAt;
		}

		// rearrange the response codemarks to match the expected codemarks,
		// so the deepEqual succeeds
		const updatedCodemarks = data.codemarks;
		data.codemarks = [];
		for (let expectedCodemark of this.expectedData.codemarks) {
			const updatedCodemark = updatedCodemarks.find(updatedCodemark => {
				return updatedCodemark.id === expectedCodemark.id;
			});
			data.codemarks.push(updatedCodemark);
		}

		super.validateResponse(data);
	}
}

module.exports = RemoveRelatedCodemarksTest;
