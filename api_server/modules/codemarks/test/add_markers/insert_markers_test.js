'use strict';

const AddMarkersTest = require('./add_markers_test');
const Assert = require('assert');

class InsertMarkersTest extends AddMarkersTest {

	constructor(options) {
		super(options);
		this.addMarkersAt = 1;
	}

	get description() {
		return 'should return new markers and directives to update a codemark when inserting markers into a codemark';
	}

	validateResponse (data) {
		Assert.equal(data.markers[0].id, data.codemark.$set.markerIds[this.addMarkersAt], 'marker ID not in proper place in codemark markerIds');
		super.validateResponse(data);
	}
}

module.exports = InsertMarkersTest;
