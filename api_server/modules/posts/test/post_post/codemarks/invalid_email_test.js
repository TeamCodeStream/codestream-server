'use strict';

const NewUsersOnTheFlyTest = require('./new_users_on_the_fly_test');
const RandomString = require('randomstring');

class InvalidEmailTest extends NewUsersOnTheFlyTest {

	get description () {
		return 'should quietly filter out the invalid email, if a codemark is being created with a post, and new users are being added, but one of the emails is not a valid email';
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.data.addedUsers[1] = RandomString.generate(10); // not a valid email
			callback();
		});
	}
}

module.exports = InvalidEmailTest;
