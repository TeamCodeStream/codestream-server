'use strict';

const AddMarkersTest = require('./add_markers_test');

class NoCommitHashWithStreamIdTest extends AddMarkersTest {

	constructor (options) {
		super(options);
		this.repoOptions.creatorIndex = 1;
	}
	
	get description () {
		return 'should return an error when attempting to add markers to a codemark but not providing a commit hash, when a stream ID is also specified';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'commitHash must be provided for markers attached to a stream'
		};
	}

	// form the data to use in trying to add the markers
	makeTestData (callback) {
		// remove the commit hash from the data to use, but keep the stream ID
		super.makeTestData(() => {
			const marker = this.data.markers[0];
			delete marker.commitHash;
			callback();
		});
	}
}

module.exports = NoCommitHashWithStreamIdTest;
