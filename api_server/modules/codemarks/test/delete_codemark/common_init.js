// base class for many tests of the "DELETE /codemarks/:id" requests

'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const DeepClone = require(process.env.CS_API_TOP + '/server_utils/deep_clone');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const RandomString = require('randomstring');

class CommonInit {

	init (callback) {
		this.testPost = 0;
		this.expectedVersion = 2;
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.makePostlessCodemark,
			this.makeRelatedCodemarks,
			this.setExpectedData,
			this.setPath
		], callback);
	}

	setTestOptions (callback) {
		this.teamOptions.creatorIndex = 1;
		callback();
	}

	// make a postless codemark, as needed for the test
	makePostlessCodemark (callback) {
		if (this.wantPost) {
			// only need to make a postless codemark if we're not creating it
			// by creating a post
			this.codemark = this.postData[this.testPost].codemark;
			this.markers = this.postData[this.testPost].markers;
			return callback();
		}
		const codemarkData = this.getPostlessCodemarkData();
		const token = this.codemarkCreator ?
			this.users[this.codemarkCreator].accessToken :
			this.currentUser.accessToken;
		this.doApiRequest(
			{
				method: 'post',
				path: '/codemarks',
				data: codemarkData,
				token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.codemark = response.codemark;
				this.markers = response.markers;
				callback();
			}
		);
	}

	// get data to use for the postless codemark, as needed
	getPostlessCodemarkData () {
		const data = this.codemarkFactory.getRandomCodemarkData();
		Object.assign(data, {
			teamId: this.team.id,
			providerType: RandomString.generate(8),
			postId: RandomString.generate(8),
			streamId: RandomString.generate(8)
		});
		if (this.wantMarker) {
			data.markers = [this.markerFactory.getRandomMarkerData()];
		}
		return data;
	}

	// make any codemarks to be related to this one
	makeRelatedCodemarks (callback) {
		if (!this.wantRelatedCodemarks) {
			return callback();
		}
		this.relatedCodemarks = [];
		BoundAsync.timesSeries(
			this,
			3,
			this.makeRelatedCodemark,
			callback
		);
	}

	// make a codemark to be related to the one to be deleted
	makeRelatedCodemark (n, callback) {
		const data = this.getPostlessCodemarkData();
		data.relatedCodemarkIds = [this.codemark.id];
		this.doApiRequest(
			{
				method: 'post',
				path: '/codemarks',
				data,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.relatedCodemarks.push(response.codemark);
				this.expectedVersion++;
				callback();
			}
		);
	}

	setExpectedData (callback) {
		this.expectedData = {
			codemarks: [{
				id: this.codemark.id,
				_id: this.codemark.id,	// DEPRECATE ME
				$set: {
					version: this.expectedVersion,
					deactivated: true,
					relatedCodemarkIds: [],
					modifiedAt: Date.now() // placehodler
				},
				$version: {
					before: this.expectedVersion - 1,
					after: this.expectedVersion
				}
			}]
		};
		(this.relatedCodemarks || []).forEach(relatedCodemark => {
			this.expectedData.codemarks.push({
				id: relatedCodemark.id,
				_id: relatedCodemark.id,
				$set: {
					version: 2,
					modifiedAt: Date.now()
				},
				$pull: {
					relatedCodemarkIds: this.codemark.id
				},
				$version: {
					before: 1,
					after: 2
				}
			});
		});
		this.expectedCodemark = DeepClone(this.codemark);
		Object.assign(this.expectedCodemark, this.expectedData.codemarks[0].$set);
		this.modifiedAfter = Date.now();
		callback();
	}

	setPath (callback) {
		this.path = '/codemarks/' + this.codemark.id;
		callback();
	}

	deleteCodemark (callback) {
		this.doApiRequest(
			{
				method: 'delete',
				path: '/codemarks/' + this.codemark.id,
				data: null,
				token: this.token
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
