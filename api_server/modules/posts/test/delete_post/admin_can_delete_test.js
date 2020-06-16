'use strict';

const DeletePostTest = require('./delete_post_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class AdminCanDeleteTest extends DeletePostTest {

	get description () {
		return 'admins can delete posts by others on the team';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.postOptions.creatorIndex = 1;
			callback();
		});
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
				path: '/teams/' + this.team.id,
				data: {
					$push: { 
						adminIds: this.currentUser.user.id 
					}
				},
				token: this.users[1].accessToken
			},
			callback
		);
	}
}

module.exports = AdminCanDeleteTest;
