'use strict';

const DeleteReviewMarkersTest = require('./delete_review_markers_test');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class DeleteReviewRepliesTest extends DeleteReviewMarkersTest {

	get description () {
		return 'should delete all replies, including codemarks and their replies, when a post with a review is deleted';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.replyToReview,
			this.replyToReviewWithCodemark,
			this.replyToCodemark,
			this.setExpectedData
		], callback);
	}

	replyToReview (callback) {
		const review = this.postData[0].review;
		this.doApiRequest(
			{
				method: 'post',
				path: '/posts',
				data: {
					streamId: review.streamId,
					parentPostId: review.postId,
					text: this.postFactory.randomText()
				},
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.replyPost = response.post;
				callback();
			}
		);
	}

	replyToReviewWithCodemark (callback) {
		const review = this.postData[0].review;
		const codemarkData = this.codemarkFactory.getRandomCodemarkData({ wantMarkers: 2});
		this.doApiRequest(
			{
				method: 'post',
				path: '/posts',
				data: {
					streamId: review.streamId,
					parentPostId: review.postId,
					text: this.postFactory.randomText(),
					codemark: codemarkData
				},
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.replyCodemarkResponse = response;
				callback();
			}
		);
	}

	replyToCodemark (callback) {
		const review = this.postData[0].review;
		const codemark = this.replyCodemarkResponse.codemark;
		this.doApiRequest(
			{
				method: 'post',
				path: '/posts',
				data: {
					streamId: review.streamId,
					parentPostId: codemark.postId,
					text: this.postFactory.randomText()
				},
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.replyToCodemarkResponse = response;
				callback();
			}
		);
	}

	setExpectedData (callback) {
		super.setExpectedData(() => {
			if (!this.replyToCodemarkResponse) { return callback(); }

			this.expectedData.posts[0].$set.version = 5;
			this.expectedData.posts[0].$version = { before: 4, after: 5 };
			this.expectedData.reviews[0].$set.version = 5;
			this.expectedData.reviews[0].$version = { before: 4, after: 5 };
			for (let i = 0; i < this.replyCodemarkResponse.markers.length; i++) {
				this.expectedData.markers.push({
					_id: this.replyCodemarkResponse.markers[i].id,	// DEPRECATE ME
					id: this.replyCodemarkResponse.markers[i].id,
					$set: {
						deactivated: true,
						version: 2
					},
					$version: {
						before: 1,
						after: 2
					}
				});		
				const expectedMarker = DeepClone(this.replyCodemarkResponse.markers[i]);
				Object.assign(expectedMarker, this.expectedData.markers[i].$set);
				this.expectedMarkers.push(expectedMarker);	
			}

			const posts = [this.replyPost, this.replyCodemarkResponse.post, this.replyToCodemarkResponse.post];
			for (let i = 0; i < posts.length; i++) {
				const post = posts[i];
				const op = {
					_id: post.id,	// DEPRECATE ME
					id: post.id,
					$set: {
						deactivated: true,
						text: 'this post has been deleted',
						numReplies: 0,
						version: 2
					},
					$version: {
						before: 1,
						after: 2
					}
				};
				if (post.id === this.replyCodemarkResponse.post.id) {
					op.$set.version = 3;
					op.$version = { before: 2, after: 3};
				}
				this.expectedData.posts.push(op);
			}

			const codemark = this.replyCodemarkResponse.codemark;
			this.expectedData.codemarks = [{
				_id: codemark.id,	// DEPRECATE ME
				id: codemark.id,
				$set: {
					deactivated: true,
					relatedCodemarkIds: [],
					numReplies: 0,
					version: 3
				},
				$version: {
					before: 2,
					after: 3
				}
			}];

			['posts', 'codemarks', 'reviews', 'markers'].forEach(collection => {
				this.expectedData[collection].sort((a, b) => {
					return a.id.localeCompare(b.id);
				});
			});
			callback();
		});
	}

	validateResponse (data) {
		for (let type of ['posts', 'codemarks', 'reviews', 'markers']) {
			data[type].sort((a, b) => {
				return a.id.localeCompare(b.id);
			});
			for (let i = 0; i < data[type].length; i++) {
				let thing = data[type][i];
				Assert(thing.$set.modifiedAt >= this.modifiedAfter, `modifiedAt for object ${thing.id} is not greater than before the post was deleted`);
				this.expectedData[type][i].$set.modifiedAt = thing.$set.modifiedAt;
			}
		}
		super.validateResponse(data);
	}
}

module.exports = DeleteReviewRepliesTest;
