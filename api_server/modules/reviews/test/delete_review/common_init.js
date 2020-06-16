// base class for many tests of the "DELETE /reviews/:id" requests

'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const DeepClone = require(process.env.CS_API_TOP + '/server_utils/deep_clone');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');

class CommonInit {

	init (callback) {
		this.testPost = 0;
		this.expectedVersion = 2;
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.setExpectedData,
			this.setPath
		], callback);
	}

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
		this.postOptions.creatorIndex = 0;
		this.postOptions.wantReview = true;
		if (this.wantMarker) {
			this.postOptions.wantMarkers = 2;
		}
		callback();
	}

	setExpectedData (callback) {
		this.review = this.postData[this.testPost].review;
		this.markers = this.postData[this.testPost].markers;
		this.expectedData = {
			reviews: [{
				id: this.review.id,
				_id: this.review.id,	// DEPRECATE ME
				$set: {
					version: this.expectedVersion,
					deactivated: true,
					modifiedAt: Date.now(), // placehodler
					numReplies: 0
				},
				$version: {
					before: this.expectedVersion - 1,
					after: this.expectedVersion
				}
			}]
		};

		this.expectedReview = DeepClone(this.review);
		Object.assign(this.expectedReview, this.expectedData.reviews[0].$set);

		const postData = this.postData[this.testPost];
		this.expectedData.posts = [{
			_id: postData.post.id,	// DEPRECATE ME
			id: postData.post.id,
			$set: {
				deactivated: true,
				text: 'this post has been deleted',
				modifiedAt: Date.now(),	// placeholder
				numReplies: 0,
				version: 2
			},
			$version: {
				before: 1,
				after: 2
			}
		}];
		this.expectedPost = DeepClone(postData.post);
		Object.assign(this.expectedPost, this.expectedData.posts[0].$set);

		this.modifiedAfter = Date.now();
		callback();
	}

	setPath (callback) {
		this.path = '/reviews/' + this.review.id;
		callback();
	}

	deleteReview (callback) {
		this.doApiRequest(
			{
				method: 'delete',
				path: '/reviews/' + this.review.id,
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
