'use strict';

const DeleteTagTest = require('./delete_tag_test');
const ObjectID = require('mongodb').ObjectID;

class TeamNotFoundTest extends DeleteTagTest {

	get description () {
		return 'should return an error when an attempt to delete a tag for a non-existent team is made';
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
			this.path = `/team-tags/${ObjectID()}/${this.tagId}`; // substitute an ID for a non-existent team
			callback();
		});
	}
}

module.exports = TeamNotFoundTest;
