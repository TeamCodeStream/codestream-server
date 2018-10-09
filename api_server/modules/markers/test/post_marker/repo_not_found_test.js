'use strict';

const StreamOnTheFlyTest = require('./stream_on_the_fly_test');
const ObjectID = require('mongodb').ObjectID;

class RepoNotFoundTest extends StreamOnTheFlyTest {

	get description () {
		return 'should return an error when trying to create a marker referencing a stream to be created on the fly but the repo doesn\'t exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'repo'
		};
	}

	// form the data for the marker we'll create in the test
	makeMarkerData (callback) {
		// substitute an invalid ID for the repo ID
		super.makeMarkerData(() => {
			this.data.repoId = ObjectID();
			callback();
		});
	}
}

module.exports = RepoNotFoundTest;
