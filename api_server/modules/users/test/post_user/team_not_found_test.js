'use strict';

const PostUserTest = require('./post_user_test');
const ObjectID = require('mongodb').ObjectID;

class TeamNotFoundTest extends PostUserTest {

	get description () {
		return 'should return error when attempting to invite a user to a non-existent team';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011'
		};
	}

	// form the data for the user update
	makeUserData (callback) {
		super.makeUserData(() => {
			this.data.teamId = ObjectID();	// substitute bogus team
			callback();
		});
	}
}

module.exports = TeamNotFoundTest;
