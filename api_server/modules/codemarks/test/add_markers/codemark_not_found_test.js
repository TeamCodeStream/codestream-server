'use strict';

const AddMarkersTest = require('./add_markers_test');
const ObjectID = require('mongodb').ObjectID;

class CodemarkNotFoundTest extends AddMarkersTest {

	get description () {
		return 'should return an error when trying to add markers to a codemark that doesn\'t exist';
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
			this.path = `/codemarks/${ObjectID()}/add-markers`; // substitute an ID for a non-existent codemark
			callback();
		});
	}
}

module.exports = CodemarkNotFoundTest;
