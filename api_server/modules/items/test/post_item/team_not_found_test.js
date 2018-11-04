'use strict';

const PostItemTest = require('./post_item_test');
const ObjectID = require('mongodb').ObjectID;

class TeamNotFoundTest extends PostItemTest {

	get description () {
		return 'should return error when attempting to create an item with an invalid team id';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011'
		};
	}

	// before the test runs...
	before (callback) {
		// substitute an ID for a non-existent team when trying to create the item
		super.before(error => {
			if (error) { return callback(error); }
			this.data.teamId = ObjectID();
			callback();
		});
	}
}

module.exports = TeamNotFoundTest;
