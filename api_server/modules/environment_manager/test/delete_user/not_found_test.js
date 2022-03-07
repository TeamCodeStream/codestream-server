'use strict';

const DeleteUserTest = require('./delete_user_test');
const ObjectId = require('mongodb').ObjectId;

class NotFoundTest extends DeleteUserTest {

	get description () {
		return 'should return an error when trying to delete a user from across environments that doesn\'t exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003'
		};
	}

	// before the test runs...
	before (callback) {
		// we'll try to delete a user with a random (non-existent) ID
		super.before(error => {
			if (error) { return callback(error); }
			this.path = '/xenv/delete-user/' + ObjectId();
			callback();
		});
	}
}

module.exports = NotFoundTest;
