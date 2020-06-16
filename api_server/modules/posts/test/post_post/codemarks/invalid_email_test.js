'use strict';

const NewUsersOnTheFlyTest = require('./new_users_on_the_fly_test');
const RandomString = require('randomstring');

class InvalidEmailTest extends NewUsersOnTheFlyTest {

	get description () {
		return 'should return an error if a codemark is being created with a post, and new users are being added, but one of the emails is not a valid email';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: {
				email: 'invalid email'
			}
		};
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.data.addedUsers[1] = RandomString.generate(10); // not a valid email
			callback();
		});
	}
}

module.exports = InvalidEmailTest;
