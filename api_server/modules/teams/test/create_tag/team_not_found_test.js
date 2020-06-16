'use strict';

const CreateTagTest = require('./create_tag_test');
const ObjectID = require('mongodb').ObjectID;

class TeamNotFoundTest extends CreateTagTest {

	get description () {
		return 'should return an error when an attempt to create a tag for a non-existent team is made';
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
			this.path = '/team-tags/' + ObjectID(); // substitute an ID for a non-existent team
			callback();
		});
	}
}

module.exports = TeamNotFoundTest;
