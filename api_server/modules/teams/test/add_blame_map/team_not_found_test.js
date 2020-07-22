'use strict';

const AddBlameMapTest = require('./add_blame_map_test');
const ObjectID = require('mongodb').ObjectID;

class TeamNotFoundTest extends AddBlameMapTest {

	get description () {
		return 'should return an error when an attempt to add a blame-map entry for a non-existent team is made';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.path = '/add-blame-map/' + ObjectID(); // substitute an ID for a non-existent team
			callback();
		});
	}
}

module.exports = TeamNotFoundTest;
