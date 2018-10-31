'use strict';

const MarkerTest = require('./marker_test');

class PostContextMustBeStringTest extends MarkerTest {

	get description () {
		return 'should return an error when attempting to create a post with a marker element where the postContext is not a string';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'invalid postContext'
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// use "numeric" for the post-context code ... not allowed!
		super.makePostData(() => {
			this.data.markers[0].postContext = 1;
			callback();
		});
	}
}

module.exports = PostContextMustBeStringTest;
