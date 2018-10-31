'use strict';

const MarkerTest = require('./marker_test');

class RemotesMustBeArrayOfStringsTest extends MarkerTest {

	get description () {
		return 'should return an error when attempting to create a post with a marker element where the remotes is not an array of strings';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'invalid remotes'
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// set the "remotes" field to an array with mixed elements
		super.makePostData(() => {
			this.data.markers[0].remotes = [1, 'hello', 2];
			callback();
		});
	}
}

module.exports = RemotesMustBeArrayOfStringsTest;
