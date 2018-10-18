'use strict';

const DirectOnTheFlyTest = require('./direct_on_the_fly_test');
const ObjectID = require('mongodb').ObjectID;

class InvalidTeamIdTest extends DirectOnTheFlyTest {

	get description () {
		return 'should return an error when attempting to create a post and creating a direct stream on the fly with an invalid team id';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011'
		};
	}

	// before the test runs...
	before (callback) {
		// substitute an ID for a non-existent team when trying to create the post
		super.before(error => {
			if (error) { return callback(error); }
			this.data.stream.teamId = ObjectID();
			callback();
		});
	}
}

module.exports = InvalidTeamIdTest;
