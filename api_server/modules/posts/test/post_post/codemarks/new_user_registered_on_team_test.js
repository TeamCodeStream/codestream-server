'use strict';

const NewUsersOnTheFlyTest = require('./new_users_on_the_fly_test');

class NewUserRegisteredOnTeamTest extends NewUsersOnTheFlyTest {

	get description () {
		return 'should be ok to add a new user on the fly who is already an registered user on the team when creating a post with a codemark';
	}
	
	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.userOptions.numRegistered = 2;
			callback();
		});
	}

	// form the data we'll use in creating the post
	makePostData (callback) {
		super.makePostData(error => {
			if (error) { return callback(error); }
			this.data.addedUsers[1] = this.users[2].user.email;
			callback();
		});
	}
}

module.exports = NewUserRegisteredOnTeamTest;
