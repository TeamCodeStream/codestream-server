'use strict';

const MoveTest = require('./move_test');

class TooManyRemotesTest extends MoveTest {

	get description () {
		return 'should return an error when attempting to move the location for a marker and the remotes array for the new location has too many elements';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'too many remotes'
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.remotes = new Array(101).fill('x');
			callback();
		});
	}
}

module.exports = TooManyRemotesTest;
