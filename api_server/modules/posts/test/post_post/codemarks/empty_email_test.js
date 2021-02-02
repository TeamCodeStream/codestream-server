'use strict';

const NewUsersOnTheFlyTest = require('./new_users_on_the_fly_test');
//const RandomString = require('randomstring');

class EmptyEmailTest extends NewUsersOnTheFlyTest {

	get description () {
		return 'should quietly filter out empty emails if a codemark is being created with a post, and new users are being added, but one of the emails is empty';
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.data.addedUsers[1] = ''; // empty email
			callback();
		});
	}
}

module.exports = EmptyEmailTest;
