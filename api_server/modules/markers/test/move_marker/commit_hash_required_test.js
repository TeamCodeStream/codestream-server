'use strict';

const MoveTest = require('./move_test');

class CommitHashRequiredTest extends MoveTest {

	get description () {
		return 'should return an error when trying to move the location for a marker with no commit hash';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'commitHash must be provided for markers attached to a stream with a repo'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data.commitHash;
			callback();
		});
	}
}

module.exports = CommitHashRequiredTest;
