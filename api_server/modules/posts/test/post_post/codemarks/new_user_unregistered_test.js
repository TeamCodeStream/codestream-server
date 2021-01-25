'use strict';

const NewUsersOnTheFlyTest = require('./new_users_on_the_fly_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class NewUserUnregisteredTest extends NewUsersOnTheFlyTest {

	get description () {
		return 'should be ok to add a new user on the fly who is already an unregistered user when creating a post with a codemark';
	}
	
	// form the data we'll use in creating the post
	makePostData (callback) {
		this.noFirstInviteType = [false, true];
		BoundAsync.series(this, [
			super.makePostData,
			this.createUnregisteredUser
		], callback);
	}

	createUnregisteredUser (callback) {
		this.userFactory.registerRandomUser((error, response) => {
			if (error) { return callback(error); }
			this.data.addedUsers[1] = response.user.email;
			callback();
		});
	}
}

module.exports = NewUserUnregisteredTest;
