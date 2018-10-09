'use strict';

const PostMarkerTest = require('./post_marker_test');

class TooManyRemotesTest extends PostMarkerTest {

	get description () {
		return 'should return an error when trying to create a marker and too many remote URLs are provided';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'too many remotes'
		};
	}

	// form the data for the marker we'll create in the test
	makeMarkerData (callback) {
		// send 101 remotes
		super.makeMarkerData(() => {
			this.data.remotes = new Array(101).fill('x');
			callback();
		});
	}
}

module.exports = TooManyRemotesTest;
