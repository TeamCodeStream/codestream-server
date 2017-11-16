'use strict';

var DirectOnTheFlyTest = require('./direct_on_the_fly_test');
var ObjectID = require('mongodb').ObjectID;

class InvalidTeamIdTest extends DirectOnTheFlyTest {

	get description () {
		return 'should return an error when attempting to create a post and creating a direct stream on the fly with an invalid team id';
	}

	getExpectedFields () {
		return null;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011'
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.stream.teamId = ObjectID();
			callback();
		});
	}
}

module.exports = InvalidTeamIdTest;
