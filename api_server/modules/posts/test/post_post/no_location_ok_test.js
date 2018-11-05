'use strict';

const CodemarkMarkerTest = require('./codemark_marker_test');

class NoLocationOkTest extends CodemarkMarkerTest {

	get description () {
		return 'should accept the post and codemark and return them when no location is given with a marker';
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// completely remove the location, this is permitted
		super.makePostData(() => {
			delete this.data.codemark.markers[0].location;
			callback();
		});
	}
}

module.exports = NoLocationOkTest;
