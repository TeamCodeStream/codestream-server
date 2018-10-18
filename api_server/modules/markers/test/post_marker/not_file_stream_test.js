'use strict';

const PostMarkerTest = require('./post_marker_test');

class NotFileStreamTest extends PostMarkerTest {

	get description () {
		return `should return an error when trying to create a marker referencing a ${this.streamType} stream`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011'
		};
	}

	// form the data for the marker we'll create in the test
	makeMarkerData (callback) {
		// substitute the ID of a non-file stream
		super.makeMarkerData(() => {
			this.data.streamId = this.stream._id;
			callback();
		});
	}

}

module.exports = NotFileStreamTest;
