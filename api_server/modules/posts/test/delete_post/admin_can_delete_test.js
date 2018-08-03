'use strict';

const DeletePostTest = require('./delete_post_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class AdminCanDeleteTest extends DeletePostTest {

	constructor (options) {
		super(options);
		this.otherUserCreatesPost = true;
	}

	get description () {
		return 'admins can delete posts by others on the team';
	}

	// before the test runs...
	before (callback) {
		// usual setup, but make the user an admin, they should be able to delete the post
		BoundAsync.series(this, [
			super.before,
			this.makeCurrentUserAdmin
		], callback);
	}

	// make the current user an admin for the team
	makeCurrentUserAdmin (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/teams/' + this.team._id,
				data: {
					$push: { 
						adminIds: this.currentUser._id 
					}
				},
				token: this.teamCreatorData.accessToken
			},
			callback
		);
	}
}

module.exports = AdminCanDeleteTest;
