'use strict';

const CodemarkWithReferenceLocationsTest = require('./codemark_with_reference_locations_test');

class CodemarkWithInvalidLocationInReferenceLocationTest extends CodemarkWithReferenceLocationsTest {

	get description () {
		return 'should return an error when attempting to create a post with a codemark with a marker that has additional reference locations, but one of the reference locations has an invalid location object';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'invalid location'
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// remove the location from the reference location to use in creating the codemark
		super.makePostData(() => {
			this.data.codemark.markers[0].referenceLocations[1].location = 'x';
			callback();
		});
	}
}

module.exports = CodemarkWithInvalidLocationInReferenceLocationTest;
