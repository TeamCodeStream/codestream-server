'use strict';

const PostCodeMarkTest = require('./post_codemark_test');
const ObjectID = require('mongodb').ObjectID;

class TeamNotFoundTest extends PostCodeMarkTest {

	get description () {
		return 'should return error when attempting to create an codemark with an invalid team id';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011'
		};
	}

	// before the test runs...
	before (callback) {
		// substitute an ID for a non-existent team when trying to create the codemark
		super.before(error => {
			if (error) { return callback(error); }
			this.data.teamId = ObjectID();
			callback();
		});
	}
}

module.exports = TeamNotFoundTest;
