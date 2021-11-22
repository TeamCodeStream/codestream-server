'use strict';

const GetPostsTest = require('./get_posts_test');
const Assert = require('assert');
class ComplexTest extends GetPostsTest {

	get description () {
		return 'should return the correct posts when a complex arrangement of posts is available (codemarks, reviews, replies, code errors, etc...)';
	}

	// before the test runs...
	before (callback) {
		this.setTestOptions();
		super.before(callback);
	}
	
	setTestOptions () {
		this.repoOptions.creatorIndex = 1;
		this.postOptions.creatorIndex = 1;
		this.postOptions.numPosts = this.numPosts || 45;
		this.postOptions.postData = [];
		for (let i = 0; i < this.postOptions.numPosts; i++) {
			const nInterval = 15;
			const n = i % nInterval;
			const wantCodemark = n === 1 || n === 9 || n === 12;
			const wantReview = n === 2;
			const wantCodeError = n === 4;
			let replyTo = n === 5 ? i - 4 : undefined; // reply to codemark
			replyTo = replyTo || (n === 6 ? i - 4 : undefined); // reply to review
			replyTo = replyTo || (n === 7 ? i - 3 : undefined); // reply to code error
			replyTo = replyTo || (n === 9 ? i - 7 : undefined); // reply to review with codemark
			replyTo = replyTo || (n === 11 ? i - 7 : undefined); // reply to code error with codemark
			replyTo = replyTo || (n === 12 ? i - 3 : undefined); // reply to (reply to review with codemark)
			replyTo = replyTo || (n === 14 ? i - 3 : undefined); // reply to (reply to code error with codemark)
			const creatorIndex = (n == 4 || n === 7 || n === 11 || n === 14) ? 0 : (i % 2);
			const postOptions = {
				wantCodemark,
				wantMarkers: wantCodemark ? 1 : undefined,
				wantReview,
				numChanges: wantReview ? 1 : undefined,
				wantCodeError,
				replyTo,
				creatorIndex
			};
			this.postOptions.postData.push(postOptions);
		}
	}

	setPath (callback) {
		super.setPath(() => {
			this.expectedPosts.push(this.repoPost);
			this.expectedPosts.reverse();
			callback();
		});
	}

	// validate the response to the fetch request
	validateResponse (data) {
		for (let i = 0; i < this.expectedPosts.length; i++) {
			const post = this.expectedPosts[i];
			if (post.codemarkId) {
				const codemark = data.codemarks.find(c => c.id === post.codemarkId);
				Assert(codemark, `codemark for post ${post.id} not found`);
			} else if (post.reviewId) {
				const review = data.reviews.find(r => r.id === post.reviewId);
				Assert(review, `review for post ${post.id} not found`);
			} else if (post.codeErrorId) {
				const codeError = data.codeErrors.find(ce => ce.id === post.codeErrorId);
				Assert(codeError, `code error for post ${post.id} not found`);
			}
		}
		super.validateResponse(data);
	}
}

module.exports = ComplexTest;
