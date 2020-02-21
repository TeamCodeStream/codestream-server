// base class for many tests of the "PUT /reviews" requests

'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const DeepClone = require(process.env.CS_API_TOP + '/server_utils/deep_clone');
const RandomString = require('randomstring');

class CommonInit {

	init (callback) {
		this.expectedVersion = 2;
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.makeReviewUpdateData, // make the data to use when issuing the test request
		], callback);
	}

	// set options to use when running the test
	setTestOptions (callback) {
		this.teamOptions.creatorIndex = 1;
		this.streamOptions.creatorIndex = 1;
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

	// get the data to use when issuing the test request	
	getReviewUpdateData () {
		const data = {
			title: RandomString.generate(100),
			text: RandomString.generate(100)
		};
		if (this.updateStatus) {
			data.status = RandomString.generate(10);
		}
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
				this.message = response;
				delete this.data;	// don't need this anymore
				callback();
			}
		);
	}
}

module.exports = CommonInit;
