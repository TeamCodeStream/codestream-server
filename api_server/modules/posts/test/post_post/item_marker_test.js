'use strict';

const ItemTest = require('./item_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class ItemMarkerTest extends ItemTest {

	constructor (options) {
		super(options);
		this.expectMarker = true;
		this.expectStream = true;
	}

	get description () {
		return 'should return the post with an item and a marker when creating a post with item info and marker info';
	}

	makePostData (callback) {
		BoundAsync.series(this, [
			super.makePostData,
			this.addMarkerData
		], callback);
	}

	addMarkerData (callback) {
		this.data.item.markers = this.markerFactory.createRandomMarkers(1, { withRandomStream: true });
		callback();
	}
}

module.exports = ItemMarkerTest;
