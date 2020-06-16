'use strict';

const TrackingReplyToReviewTest = require('./tracking_reply_to_review_test');

class TrackingReplyToReviewReplyTest extends TrackingReplyToReviewTest {

	get description () {
		return 'should send a Reply Created event for tracking purposes when handling a reply to a reply to a review via email';
	}

	init (callback) {
		super.init(error => {
			if (error) { return callback(error); }
			this.doApiRequest(
				{
					method: 'post',
					path: '/posts',
					data: {
						streamId: this.postData[0].post.streamId,
						parentPostId: this.postData[0].post.id
					},
					token: this.users[0].accessToken
				},
				(error, response) => {
					if (error) { return callback(error); }
					this.expectedParentId = this.postData[0].review.id;
					this.expectedParentType = 'Review.Reply';
					const emailParts = this.data.to[0].address.split('@');
					const leftParts = emailParts[0].split('.');
					this.data.to[0].address = `${response.post.id}.${leftParts[1]}.${leftParts[2]}@${emailParts[1]}`;
					callback();
				}
			);
		});
	}
}

module.exports = TrackingReplyToReviewReplyTest;
