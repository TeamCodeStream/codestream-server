'use strict';

const CodemarkMarkerTest = require('./codemark_marker_test');
const Assert = require('assert');

class AttachToReviewTest extends CodemarkMarkerTest {

	// for reply
	constructor (options) {
		super(options);
		this.expectedSeqNum = 2;	// two posts in the stream, overrides the default of 1
		this.expectedVersion = 3;	// stream update will get a version bump
	}

	get description () {
		return 'should be able to attach a codemark to a code review upon creation';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.repoOptions.creatorIndex = 1;
			Object.assign(this.postOptions, {
				creatorIndex: 1,
				numPosts: 1,
				wantReview: true,
				numChanges: 1
			});
			callback();
		});
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.data.parentPostId = this.postData[0].post.id;
			this.expectedFollowerIds = [
				this.users[1].user.id,
				this.users[0].user.id
			];
			callback();
		});
	}

	/* eslint complexity: 0 */
	// validate the response to the post request
	validateResponse (data) {
		Assert.equal(data.codemark.parentPostId, this.postData[0].post.id, 'codemark\'s parentPostId not set to the id of the review post');
		Assert.equal(data.codemark.reviewId, this.postData[0].review.id, 'codemark\'s reviewId not set to id of the review');
		super.validateResponse(data);
	}
}

module.exports = AttachToReviewTest;
