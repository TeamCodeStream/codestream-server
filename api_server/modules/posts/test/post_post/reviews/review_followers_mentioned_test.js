'use strict';

const ReviewTest = require('./review_test');

class ReviewFollowersMentionedTest extends ReviewTest {

	get description () {
		return 'should return a valid post and review with the mentioned users as follower IDs when creating a post with a review mentioning users';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.userOptions.numRegistered = 5;
			callback();
		});
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.data.mentionedUserIds = [
				this.users[1].user.id,
				this.users[3].user.id
			];
			this.expectedFollowerIds = [
				this.currentUser.user.id,
				this.users[1].user.id,
				this.users[3].user.id
			];
			callback();
		});
	}
}

module.exports = ReviewFollowersMentionedTest;
