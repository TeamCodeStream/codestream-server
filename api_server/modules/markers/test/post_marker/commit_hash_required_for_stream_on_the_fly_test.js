'use strict';

const StreamOnTheFlyTest = require('./stream_on_the_fly_test');

class CommitHashRequiredForStreamOnTheFlyTest extends StreamOnTheFlyTest {

	get description () {
		return 'should return an error when trying to create a marker that references an stream to be created on the fly but no commit hash is given';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'commitHash must be provided'
		};
	}

	// form the data for the marker we'll create in the test
	makeMarkerData (callback) {
		// remove the commit hash
		super.makeMarkerData(() => {
			delete this.data.commitHash;
			callback();
		});
	}
}

module.exports = CommitHashRequiredForStreamOnTheFlyTest;
