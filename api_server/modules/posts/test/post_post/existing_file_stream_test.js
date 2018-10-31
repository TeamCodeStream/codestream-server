'use strict';

const ItemMarkerTest = require('./item_marker_test');

class ExistingFileStreamTest extends ItemMarkerTest {

	get description () {
		return 'should return the post with an item and a marker when creating a post with item info and marker info, where the marker references an existing stream';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.repoOptions.creatorIndex = 1;
			this.expectStream = false;
			callback();
		});
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.data.item.markers = this.markerFactory.createRandomMarkers(1, { fileStreamId: this.repoStreams[0]._id });
			callback();
		});
	}
}

module.exports = ExistingFileStreamTest;
