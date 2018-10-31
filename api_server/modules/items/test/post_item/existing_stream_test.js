'use strict';

const MarkerTest = require('./marker_test');

class ExistingStreamTest extends MarkerTest {

	get description () {
		return 'should return a valid item with marker data when creating an item tied to a third-party post, and including a marker, where the marker references an existing stream';
	}

	setTestOptions (callback) {
		this.repoOptions.creatorIndex = 1;
		this.expectStream = false;
		callback();
	}

	makeItemData (callback) {
		super.makeItemData(() => {
			this.data.markers = this.markerFactory.createRandomMarkers(1, { fileStreamId: this.repoStreams[0]._id });
			callback();
		});
	}
}

module.exports = ExistingStreamTest;
