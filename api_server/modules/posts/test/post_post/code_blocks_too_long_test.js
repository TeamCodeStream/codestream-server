'use strict';

const MarkerTest = require('./marker_test');

class MarkersTooLongTest extends MarkerTest {

	get description () {
		return 'should return an error when attempting to create a post with a markers array that is too long';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'markers: array is too long'
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// create an array of markers that is over the limit in size
		super.makePostData(() => {
			const moreStuff = 'x,'.repeat(10).split(',');
			this.data.markers = [...this.data.markers, ...moreStuff];
			callback();
		});
	}
}

module.exports = MarkersTooLongTest;
