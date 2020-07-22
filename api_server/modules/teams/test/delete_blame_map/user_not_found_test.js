'use strict';

const AddBlameMapTest = require('./add_blame_map_test');
const ObjectID = require('mongodb').ObjectID;

class UserNotFoundTest extends AddBlameMapTest {

	get description() {
		return 'should return an error when an attempt to add a blame-map entry with a non-existent user is made';
	}

	getExpectedError() {
		return {
			code: 'RAPI-1003'
		};
	}

	// before the test runs...
	before(callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.userId = ObjectID(); // substitute an ID for a non-existent user
			callback();
		});
	}
}

module.exports = UserNotFoundTest;
