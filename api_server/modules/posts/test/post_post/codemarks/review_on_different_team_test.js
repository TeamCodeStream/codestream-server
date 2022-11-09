'use strict';

const AttachToReviewTest = require('./attach_to_review_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class ReviewOnDifferentTeamTest extends AttachToReviewTest {

	get description () {
		return 'should return an error when attempting to create a codemark and attach it to a review that is on a different team than the codemark';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011'
		};
	}

	makePostData (callback) {
		BoundAsync.series(this, [
			super.makePostData,
			this.createOtherTeam
		], callback);
	}

	createOtherTeam (callback) {
		// the current user will create their own team, and since they are not a member 
		// of the team that owns the review, the codemark creation should fail
		this.companyFactory.createRandomCompany(
			(error, response) => {
				if (error) { return callback(error); }
				this.data.streamId = response.streams[0].id;
				delete this.data.codemark.markers;	// ignore markers on this request, since we don't have a file stream in this team for them to go into
				callback();
			},
			{
				token: this.token
			}
		);
	}
}

module.exports = ReviewOnDifferentTeamTest;
