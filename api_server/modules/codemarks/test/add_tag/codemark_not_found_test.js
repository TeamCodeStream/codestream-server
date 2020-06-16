'use strict';

const AddTagTest = require('./add_tag_test');
const ObjectID = require('mongodb').ObjectID;

class CodemarkNotFoundTest extends AddTagTest {

	get description () {
		return 'should return an error when trying to add a tag to a non-existent codemark';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'codemark'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			// substitute an ID for a non-existent codemark
			this.path = `/codemarks/${ObjectID()}/add-tag`;
			callback();
		});
	}
}

module.exports = CodemarkNotFoundTest;
