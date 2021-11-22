'use strict';

const NewPostMessageToTeamStreamTest = require('../new_post_message_to_team_stream_test');

class ReviewMessageTest extends NewPostMessageToTeamStreamTest {

	get description () {
		return 'members of the team should receive a message with the post and ewciwq when a post with a review is posted to a team stream';
	}

	setTestOptions (callback) {
		 super.setTestOptions(() => {
			 this.repoOptions.creatorIndex = 1;
			 callback();
		 });
	}

	makePostData (callback) {
		super.makePostData(error => {
			if (error) { return callback(error); }
			this.data.review = this.reviewFactory.getRandomReviewData({ 
				numChanges: 2,
				changesetRepoId: this.repo.id
			});
			callback();
		});
	}
}

module.exports = ReviewMessageTest;
