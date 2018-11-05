'use strict';

const MarkerTest = require('./marker_test');

class NoLocationOkTest extends MarkerTest {

	get description () {
		return 'should accept the codemark and return it when no location is given with a marker';
	}

	// form the data to use in trying to create the codemark
	makeCodemarkData (callback) {
		// completely remove the location, this is permitted
		super.makeCodemarkData(() => {
			delete this.data.markers[0].location;
			callback();
		});
	}
}

module.exports = NoLocationOkTest;
