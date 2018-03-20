'use strict';

var PutMarkerTest = require('./put_marker_test');
var ObjectID = require('mongodb').ObjectID;

class MarkerNotFoundTest extends PutMarkerTest {

	get description () {
		return 'should return an error when trying to update a marker that doesn\'t exist';
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
			this.path = '/markers/' + ObjectID(); // substitute an ID for a non-existent marker
			callback();
		});
	}
}

module.exports = MarkerNotFoundTest;
