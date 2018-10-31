'use strict';

const MarkerTest = require('./marker_test');

class NoCodeTest extends MarkerTest {

	get description () {
		return 'should return an error when attempting to create a post with a marker element with no code';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'missing code'
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// delete the code text
		super.makePostData(() => {
			delete this.data.markers[0].code;
			callback();
		});
	}
}

module.exports = NoCodeTest;
