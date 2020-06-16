'use strict';

const ReferenceLocationTest = require('./reference_location_test');
const ObjectID = require('mongodb').ObjectID;

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
			this.path = `/markers/${ObjectID()}/reference-location`; // substitute an ID for a non-existent marker
			callback();
		});
	}
}

module.exports = MarkerNotFoundTest;
