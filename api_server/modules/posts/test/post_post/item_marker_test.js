'use strict';

const ItemTest = require('./item_test');

class ItemMarkerTest extends ItemTest {

	constructor (options) {
		super(options);
		this.expectMarker = true;
		this.repoOptions.creatorIndex = 1;
	}

	get description () {
		return 'should return the post with an item and a marker when creating a post with item info and marker info';
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.data.item.markers = this.markerFactory.createRandomMarkers(1, { fileStreamId: this.repoStreams[0]._id });
			callback();
		});
	}
}

module.exports = ItemMarkerTest;
