'use strict';

const GetPostsTest = require('./get_posts_test');
const Assert = require('assert');

class ComplexTest extends GetPostsTest {

	constructor (options) {
		super(options);
		this.repoOptions.creatorIndex = 1;
		this.postOptions.creatorIndex = 1;
		this.postOptions.numPosts = 45;
		this.postOptions.postData = [];
		this.postOptions.claimCodeErrors = true;
		for (let i = 0; i < this.postOptions.numPosts; i++) {
			const nInterval = this.postOptions.numPosts / 3;
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

	get description () {
		return 'should return the correct posts when a complex arrangement of posts is available (codemarks, reviews, replies, code errors, etc...)';
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
		for (let i = 0; i < this.postData.length; i++) {
			const post = this.postData[i].post;
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
