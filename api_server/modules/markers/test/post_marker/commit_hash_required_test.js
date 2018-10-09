'use strict';

const PostMarkerTest = require('./post_marker_test');

class CommitHashRequiredTest extends PostMarkerTest {

	get description () {
		return 'should return an error when trying to create a marker that references an existing stream but no commit hash is given';
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

module.exports = CommitHashRequiredTest;
