'use strict';

const Markertest = require('./marker_test');

class NoCommitHashWithStreamIdTest extends Markertest {

	constructor (options) {
		super(options);
		this.repoOptions.creatorIndex = 1;
	}
	
	get description () {
		return 'should return an error when attempting to create an codemark with a marker but not providing a commit hash, when a stream ID is also specified';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'commitHash must be provided for markers attached to a stream'
		};
	}

	// form the data to use in trying to create the codemark
	makeCodeMarkData (callback) {
		// remove the commit hash from the data to use in creating the codemark, but keep the stream ID
		super.makeCodeMarkData(() => {
			const marker = this.data.markers[0];
			delete marker.commitHash;
			callback();
		});
	}
}

module.exports = NoCommitHashWithStreamIdTest;
