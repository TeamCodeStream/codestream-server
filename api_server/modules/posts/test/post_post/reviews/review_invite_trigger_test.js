'use strict';

const ReviewMarkersTest = require('./review_markers_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class ReviewInviteTriggerTest extends ReviewMarkersTest {

	get description () {
		return 'when a review is created with an unregistered user as the reviewer, the lastInviteType and inviteTrigger of the unregistered user should get updated';
	}

	// run the test...
	run (callback) {
		BoundAsync.series(this, [
			super.run,	// run the parent's test, but then...
			this.checkUser	// ...we'll check that the unregistered user object has been updated
		], callback);
	}

	// form the data for the post we'll create in the test
	makePostData (callback) {
		super.makePostData(() => {
			// add users to the mentionedUserIds array
			this.unregisteredUser = this.users.find(user => !user.user.isRegistered);
			this.data.review.reviewers = [this.unregisteredUser.user.id];
			this.expectedFollowerIds = [this.currentUser.user.id, this.unregisteredUser.user.id];
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		// just save the ID of the review created
		this.reviewId = data.review.id;
		super.validateResponse(data);
	}

	// check the unregistered user object for the correct updates
	checkUser (callback) {
		this.doApiRequest(
			{
				method: 'get',
				path: '/users/' + this.unregisteredUser.user.id,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				Assert.equal(response.user.lastInviteType, 'reviewNotification', 'lastInviteType should be "reviewNotification"');
				Assert.equal(response.user.inviteTrigger, `R${this.reviewId}`);
				callback();
			}
		);
	}
}

module.exports = ReviewInviteTriggerTest;
