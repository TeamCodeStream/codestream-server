'use strict';

const AddAdminsTest = require('./add_admins_test');
const ObjectId = require('mongodb').ObjectId;

class UsersNotFound extends AddAdminsTest {

	get description () {
		return 'should return an error when trying to add admins when one or more of the users don\'t exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003'
		};
	}

	// before the test runs...
	makeTeamData (callback) {
		// substitute bogus memberIds value
		super.makeTeamData(() => {
			this.data.$addToSet.adminIds.push(ObjectId());
			callback();
		});
	}
}

module.exports = UsersNotFound;
