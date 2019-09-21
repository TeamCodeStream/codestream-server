'use strict';

const MoveTest = require('./move_test');

class InvalidLocationTest extends MoveTest {

	get description () {
		return 'should return an error when trying to move the location for a marker with an invalid location';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'invalid location'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.location = 'x';
			callback();
		});
	}
}

module.exports = InvalidLocationTest;
