'use strict';

const ReferenceLocationTest = require('./reference_location_test');
const ObjectId = require('mongodb').ObjectId;

class MarkerNotFoundTest extends ReferenceLocationTest {

	get description () {
		return 'should return an error when trying to add a reference location for a marker that doesn\'t exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'marker'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.path = `/markers/${ObjectId()}/reference-location`; // substitute an ID for a non-existent marker
			callback();
		});
	}
}

module.exports = MarkerNotFoundTest;
