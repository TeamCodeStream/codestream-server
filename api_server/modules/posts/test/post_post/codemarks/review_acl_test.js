'use strict';

const AttachToReviewTest = require('./attach_to_review_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class ReviewACLTest extends AttachToReviewTest {

	get description () {
		return 'should return an error when attempting to create a codemark and attach it to a review that the user does not have access to';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011',
			reason: 'user does not have access to the review'
		};
	}

	setTestOptions (callback) {
		// make the current user not a member of the stream the review will go into
		super.setTestOptions(() => {
			this.streamOptions.members = [];
			callback();
		});
	}

	makePostData (callback) {
		BoundAsync.series(this, [
			super.makePostData,
			this.createOtherStream
		], callback);
	}

	createOtherStream (callback) {
		// we'll create a private channel to put our codemark into, and since we don't
		// have access to the stream the review was created in, the codemark creation should fail
		this.doApiRequest(
			{
				method: 'post',
				path: '/streams',
				data: {
					type: 'channel',
					name: 'private',
					teamId: this.team.id
				},
				token: this.token
			},
			(error, response) => {
				this.data.streamId = response.stream.id;
				callback();
			}
		);
	}
}

module.exports = ReviewACLTest;
