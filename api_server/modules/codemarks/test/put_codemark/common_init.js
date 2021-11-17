// base class for many tests of the "PUT /codemarks" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');
const RandomString = require('randomstring');

class CommonInit {

	init (callback) {
		this.expectedVersion = 2;
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.makePostlessCodemark,	// make a postless codemark, as needed
			this.makeCodemarkUpdateData, // make the data to use when issuing the test request
			this.createRelatedCodemarks, // make related codemarks, as needed
			this.adjustExpectedDataForRelatedCodemarks // make adjustments to expected test results
		], callback);
	}

	// set options to use when running the test
	setTestOptions (callback) {
		this.teamOptions.creatorIndex = 1;
		if (!this.goPostless) {
			Object.assign(this.postOptions, {
				creatorIndex: 0,
				wantCodemark: true,
				codemarkType: this.codemarkType || 'comment'
			});
		}
		callback();
	}

	// make a postless codemark, as needed for the test
	makePostlessCodemark (callback) {
		if (!this.goPostless) {
			return callback();
		}
		const codemarkData = this.getPostlessCodemarkData();
		this.doApiRequest(
			{
				method: 'post',
				path: '/codemarks',
				data: codemarkData,
				token: this.currentUser.accessToken
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
		const data = this.codemarkFactory.getRandomCodemarkData({ codemarkType: this.codemarkType || 'comment' });
		Object.assign(data, {
			teamId: this.team.id,
			providerType: RandomString.generate(8)
		});
		if (this.wantMarker) {
			data.markers = [this.markerFactory.getRandomMarkerData()];
		}
		return data;
	}

	// get the data to use when issuing the test request	
	getCodemarkUpdateData () {
		const data = {
			title: RandomString.generate(100),
			text: RandomString.generate(100)
		};
		if (this.updatePostId) {
			Object.assign(data, {
				postId: RandomString.generate(10),
				streamId: RandomString.generate(10)
			});
		}
		if (this.updateExternal) {
			const provider = RandomString.generate(10);
			Object.assign(data, {
				externalProvider: provider,
				externalProviderHost: `${provider}.com`,
				externalProviderUrl: `${provider}.com/${RandomString.generate(10)}`
			});
		}
		if (this.updateExternalAssignees) {
			Object.assign(data, {
				externalAssignees: [
					{ id: RandomString.generate(10), name: RandomString.generate(10) },
					{ id: RandomString.generate(10), name: RandomString.generate(10) }
				]
			});
		}
		if (this.updateUrls) {
			const codeProvider = RandomString.generate(10);
			const threadProvider = RandomString.generate(10);
			Object.assign(data, {
				remoteCodeUrl: {
					name: codeProvider,
					url: `https://${codeProvider}.com/${RandomString.generate(10)}`
				},
				threadUrl: {
					name: threadProvider,
					url: `https://${threadProvider}.com/${RandomString.generate(10)}`
				}
			});
		}
		return data;
	}

	// make the data to use when issuing the test request
	makeCodemarkUpdateData (callback) {
		if (this.postData && this.postData[0]) {
			this.codemark = this.postData[0].codemark;
		}
		this.data = this.getCodemarkUpdateData();
		this.expectedData = {
			codemark: {
				_id: this.codemark.id,	// DEPRECATE ME
				id: this.codemark.id,
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
		this.expectedCodemark = DeepClone(this.codemark);
		Object.assign(this.expectedCodemark, this.expectedData.codemark.$set);
		this.modifiedAfter = Date.now();
		this.path = '/codemarks/' + this.codemark.id;
		callback();
	}

	// create several codemarks to be related to the codemark to be updated during the test
	createRelatedCodemarks (callback) {
		if (!this.wantRelatedCodemarks) {
			return callback();
		}
		this.addedRelatedCodemarkIds = [];
		this.data.relatedCodemarkIds = [...(this.prerelatedCodemarkIds || [])];
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
				this.addedRelatedCodemarkIds.push(response.codemark.id);
				this.data.relatedCodemarkIds.push(response.codemark.id);
				callback();
			}
		);
	}

	// adjust the expected response data to reflect the related codemarks
	adjustExpectedDataForRelatedCodemarks (callback) {
		if (!this.wantRelatedCodemarks) {
			return callback();
		}
		this.expectedData.codemark.$set.relatedCodemarkIds = [...(this.prerelatedCodemarkIds || []), ...this.addedRelatedCodemarkIds];
		this.expectedData.codemarks = this.addedRelatedCodemarkIds.map(relatedCodemarkId => {
			return {
				id: relatedCodemarkId,
				_id: relatedCodemarkId,
				$addToSet: {
					relatedCodemarkIds: this.codemark.id
				},
				$set: {
					modifiedAt: Date.now(),	// placeholder
					version: 2
				},
				$version: {
					before: 1,
					after: 2
				}
			};
		});
		this.expectedCodemark.relatedCodemarkIds = [...this.prerelatedCodemarkIds || [], ...this.addedRelatedCodemarkIds];
		callback();
	}

	// perform the actual update 
	updateCodemark (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/codemarks/' + this.codemark.id,
				data: this.data,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.message = response;
				delete this.data;	// don't need this anymore
				callback();
			}
		);
	}
}

module.exports = CommonInit;
