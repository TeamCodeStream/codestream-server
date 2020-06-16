// base class for many tests of the "PUT /relate-codemark/:id1/:id2" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');
const RandomString = require('randomstring');

class CommonInit {

	init (callback) {
		this.teamOptions.creatorIndex = 1;
		BoundAsync.series(this, [
			CodeStreamAPITest.prototype.before.bind(this),
			this.makePreRelatedCodemarks,	// make two codemarks that will be related to the test codemarks, as needed
			this.makeCodemarks, 			// make the two codemarks to relate
			this.makeCodemarkRelateData		// make the data to use when issuing the test request
		], callback);
	}

	// make two codemarks that will be related to the test codemarks, as needed
	makePreRelatedCodemarks (callback) {
		this.preRelatedCodemarks = [];
		if (!this.doPreRelatedCodemarks) {
			return callback();
		}
		this.doingPreRelatedCodemarks = true;
		BoundAsync.timesSeries(
			this,
			2,
			this.makeCodemark,
			callback
		);
	}

	// make the two codemarks to relate
	makeCodemarks (callback) {
		this.testCodemarks = [];
		this.doingPreRelatedCodemarks = false;
		BoundAsync.timesSeries(
			this,
			2,
			this.makeCodemark,
			callback
		);
	}

	// make a single codemark
	makeCodemark (n, callback) {
		const data = this.codemarkFactory.getRandomCodemarkData();
		const teamId = this.secondCodemarkInOtherTeam && n === 1 ? this.otherTeam.id : this.team.id;
		Object.assign(data, {
			teamId,
			providerType: RandomString.generate(8)
		});
		data.markers = [this.markerFactory.getRandomMarkerData()];

		// we'll relate the two test codemarks to other codemarks, as needed
		if (this.doPreRelatedCodemarks && !this.doingPreRelatedCodemarks) {
			data.relatedCodemarkIds = [this.preRelatedCodemarks[n].id];
		}

		this.doApiRequest(
			{
				method: 'post',
				path: '/codemarks',
				data: data,
				token: this.users[1].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				const codemarks = this.doingPreRelatedCodemarks ? this.preRelatedCodemarks : this.testCodemarks;
				codemarks.push(response.codemark);
				callback();
			}
		);
	}

	// make the data to use when issuing the test request
	makeCodemarkRelateData (callback) {
		this.expectedResponse = {
			codemarks: []
		};
		this.expectedCodemarks = [];
		this.modifiedAfter = Date.now();
		this.path = `/relate-codemark/${this.testCodemarks[0].id}/${this.testCodemarks[1].id}`;
		for (let i = 0; i < 2; i++) {
			const relatedCodemarkId = this.testCodemarks[1 - i].id;
			this.expectedResponse.codemarks.push({
				_id: this.testCodemarks[i].id,	// DEPRECATE ME
				id: this.testCodemarks[i].id,
				$set: {
					version: 2,
					modifiedAt: Date.now() // placeholder
				},
				$addToSet: {
					relatedCodemarkIds: relatedCodemarkId
				},
				$version: {
					before: 1,
					after: 2
				}
			});

			const expectedCodemark = DeepClone(this.testCodemarks[i]);
			expectedCodemark.relatedCodemarkIds = expectedCodemark.relatedCodemarkIds || [];
			expectedCodemark.relatedCodemarkIds.push(relatedCodemarkId);
			this.expectedCodemarks.push(expectedCodemark);
		}

		callback();
	}

	// perform the actual relate 
	relateCodemark (callback) {
		const codemarkId1 = this.testCodemarks[0].id;
		const codemarkId2 = this.testCodemarks[1].id;
		this.doApiRequest(
			{
				method: 'put',
				path: `/relate-codemark/${codemarkId1}/${codemarkId2}`,
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
