'use strict';

const CodemarkMarkerTest = require('./codemark_marker_test');

class TooManyRemotesTest extends CodemarkMarkerTest {

	get description () {
		return 'should return an error when attempting to create a post and codemark with a marker element where the remotes array has too many elements';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'too many remotes'
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// set the "remotes" field to an array of 101 elements
		super.makePostData(() => {
			this.data.codemark.markers[0].remotes = new Array(101).fill('x');
			callback();
		});
	}
}

module.exports = TooManyRemotesTest;
