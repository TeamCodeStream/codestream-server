'use strict';

const AddMarkersTest = require('./add_markers_test');

class NoLocationOkTest extends AddMarkersTest {

	get description () {
		return 'should accept the codemark and return it when no location is given with a marker';
	}

	// form the data to use in trying to create the codemark
	makeTestData (callback) {
		// completely remove the location, this is permitted
		super.makeTestData(() => {
			delete this.data.markers[0].location;
			callback();
		});
	}
}

module.exports = NoLocationOkTest;
