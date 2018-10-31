'use strict';

const MarkerTest = require('./marker_test');

class MarkerHasImproperAttributesTest extends MarkerTest {

	get description () {
		return 'should return an error when attempting to create a post with a marker element where an improper attribute is provided';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'invalid someAttribute'
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// we'll add a marker and add some invalid attribute to it
		super.makePostData(() => {
			this.data.markers[0].someAttribute = 1;
			callback();
		});
	}
}

module.exports = MarkerHasImproperAttributesTest;
