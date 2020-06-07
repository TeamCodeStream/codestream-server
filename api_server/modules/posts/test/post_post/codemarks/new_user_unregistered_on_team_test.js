'use strict';

const NewUsersOnTheFlyTest = require('./new_users_on_the_fly_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class NewUserUnregisteredOnTeamTest extends NewUsersOnTheFlyTest {

	get description () {
		return 'should be ok to add a new user on the fly who is already an unregistered user on the team when creating a post with a codemark';
	}
	
	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.teamOptions.numAdditionalInvites = 1;
			callback();
		});
	}

	// form the data we'll use in creating the post
	makePostData (callback) {
		BoundAsync.series(this, [
			super.makePostData,
			this.addUnregisteredUser
		], callback);
	}

	addUnregisteredUser (callback) {
		const userData = this.users.find(userData => {
			const { user } = userData;
			return !user.isRegistered && (user.teamIds || []).includes(this.team.id);
		});
		this.data.addedUsers[1] = userData.user.email;
		callback();
	}
}

module.exports = NewUserUnregisteredOnTeamTest;
