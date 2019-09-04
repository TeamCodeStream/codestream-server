'use strict';

const ReferenceLocationTest = require('./reference_location_test');

class CommitHashRequiredTest extends ReferenceLocationTest {

	get description () {
		return 'should return an error when trying to add a reference location for a marker with no commit hash';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'commitHash'
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
