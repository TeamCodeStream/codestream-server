'use strict';

const MarkerTest = require('./marker_test');

class PreContextMustBeStringTest extends MarkerTest {

	get description () {
		return 'should return an error when attempting to create a post with a marker element where the preContext is not a string';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'invalid preContext'
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// use "numeric" for the pre-context code ... not allowed!
		super.makePostData(() => {
			this.data.markers[0].preContext = 1;
			callback();
		});
	}
}

module.exports = PreContextMustBeStringTest;
