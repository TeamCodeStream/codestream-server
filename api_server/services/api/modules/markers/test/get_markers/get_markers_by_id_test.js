'use strict';

var GetMarkersTest = require('./get_markers_test');

class GetMarkersByIdTest extends GetMarkersTest {

	get description () {
		return 'should return the correct markers when requesting markers by ID';
	}

	setPath (callback) {
		this.myMarkers = [
			this.myMarkers[0],
			this.myMarkers[2],
			this.myMarkers[3]
		];
		let ids = this.myMarkers.map(post => post._id);
		this.path = `/markers?teamId=${this.team._id}&streamId=${this.stream._id}&commitHash=${this.commitHash}&ids=${ids}`;
		callback();
	}
}

module.exports = GetMarkersByIdTest;
