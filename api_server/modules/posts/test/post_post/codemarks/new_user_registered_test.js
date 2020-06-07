'use strict';

const NewUsersOnTheFlyTest = require('./new_users_on_the_fly_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class NewUserRegisteredTest extends NewUsersOnTheFlyTest {

	get description () {
		return 'should be ok to add a new user on the fly who is already a registered user when creating a post with a codemark';
	}
	
	// form the data we'll use in creating the post
	makePostData (callback) {
		BoundAsync.series(this, [
			super.makePostData,
			this.createRegisteredUser
		], callback);
	}

	createRegisteredUser (callback) {
		const data = this.userFactory.getRandomUserData();
		data._confirmationCheat = this.apiConfig.secrets.confirmationCheat;
		this.userFactory.createUser(
			data,
			(error, response) => {
				if (error) { return callback(error); }
				this.data.addedUsers[1] = response.user.email;
				callback();
			}
		);
	}
}

module.exports = NewUserRegisteredTest;
