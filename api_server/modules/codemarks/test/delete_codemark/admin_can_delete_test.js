'use strict';

const DeleteCodemarkTest = require('./delete_codemark_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class AdminCanDeleteTest extends DeleteCodemarkTest {

	get description () {
		return 'admins can delete codemarks by others on the team';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.codemarkCreator = 1;
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
				path: '/teams/' + this.team._id,
				data: {
					$push: { 
						adminIds: this.currentUser.user._id 
					}
				},
				token: this.users[1].accessToken
			},
			callback
		);
	}
}

module.exports = AdminCanDeleteTest;
