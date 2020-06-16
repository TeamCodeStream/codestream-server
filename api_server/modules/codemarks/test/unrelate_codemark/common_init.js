// base class for many tests of the "PUT /unrelate-codemark/:id1/:id2" requests

'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const DeepClone = require(process.env.CS_API_TOP + '/server_utils/deep_clone');
const RandomString = require('randomstring');

class CommonInit {

	init (callback) {
		this.teamOptions.creatorIndex = 1;
		BoundAsync.series(this, [
			CodeStreamAPITest.prototype.before.bind(this),
			this.makePreRelatedCodemarks,	// make two codemarks that will be related to the test codemarks, as needed
			this.makeCodemarks, 			// make the two codemarks to relate then unrelate
			this.relateCodemarks,			// relate the two codemarks
			this.makeCodemarkUnrelateData	// make the data to use when issuing the test request
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
	makeCodemarkUnrelateData (callback) {
		this.expectedResponse = {
			codemarks: []
		};
		this.expectedCodemarks = [];
		this.modifiedAfter = Date.now();
		this.path = `/unrelate-codemark/${this.testCodemarks[0].id}/${this.testCodemarks[1].id}`;
		for (let i = 0; i < 2; i++) {
			const unrelatedCodemarkId = this.testCodemarks[1 - i].id;
			this.expectedResponse.codemarks.push({
				_id: this.testCodemarks[i].id,	// DEPRECATE ME
				id: this.testCodemarks[i].id,
				$set: {
					version: 3,
					modifiedAt: Date.now() // placeholder
				},
				$pull: {
					relatedCodemarkIds: unrelatedCodemarkId
				},
				$version: {
					before: 2,
					after: 3
				}
			});

			const expectedCodemark = DeepClone(this.testCodemarks[i]);
			expectedCodemark.relatedCodemarkIds = expectedCodemark.relatedCodemarkIds || [];
			const index = expectedCodemark.relatedCodemarkIds.indexOf(unrelatedCodemarkId);
			expectedCodemark.relatedCodemarkIds.splice(index, 1);
			this.expectedCodemarks.push(expectedCodemark);
		}

		callback();
	}

	// relate the two test codemarks
	relateCodemarks (callback) {
		const codemarkId1 = this.testCodemarks[0].id;
		const codemarkId2 = this.testCodemarks[1].id;
		this.doApiRequest(
			{
				method: 'put',
				path: `/relate-codemark/${codemarkId1}/${codemarkId2}`,
				token: this.users[1].accessToken
			},
			callback
		);
	}

	// unrelate the two test codemarks
	unrelateCodemark (callback) {
		const codemarkId1 = this.testCodemarks[0].id;
		const codemarkId2 = this.testCodemarks[1].id;
		this.doApiRequest(
			{
				method: 'put',
				path: `/unrelate-codemark/${codemarkId1}/${codemarkId2}`,
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
