'use strict';

var PutCalculateLocationsTest = require('./put_calculate_locations_test');

class LocationsSubsetTest extends PutCalculateLocationsTest {

	get description () {
		return 'should properly calculate and save marker locations when requested, when the client sends only a subset of the marker locations';
	}

	// set data to be used in the request
	setData (callback) {
		// we'll grab just a subset of the markers and pass those along in the request
		super.setData(() => {
			let allMarkerIds = Object.keys(this.locations);
			let myMarkerIds = [
				allMarkerIds[2],
				allMarkerIds[7],
				allMarkerIds[5]
			];
			let myLocations = {};
			myMarkerIds.forEach(markerId => {
				myLocations[markerId] = this.locations[markerId];
			});
			this.data.locations = this.locations = myLocations;
			callback();
		});
	}
}

module.exports = LocationsSubsetTest;
