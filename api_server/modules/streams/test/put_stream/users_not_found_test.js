'use strict';

const AddUsersTest = require('./add_users_test');
const ObjectID = require('mongodb').ObjectID;

class UsersNotFound extends AddUsersTest {

	get description () {
		return 'should return an error when trying to add users when one or more of the users don\'t exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003'
		};
	}

	// before the test runs...
	makeStreamData (callback) {
		// substitute bogus memberIds value
		super.makeStreamData(() => {
			this.data.$addToSet.memberIds.push(ObjectID());
			callback();
		});
	}
}

module.exports = UsersNotFound;
