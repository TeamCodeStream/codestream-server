'use strict';

const PostItemTest = require('./post_item_test');

class MarkerTest extends PostItemTest {

	constructor (options) {
		super(options);
		this.expectMarker = true;
		this.expectStream = true;
	}

	get description () {
		return 'should return a valid item with marker data when creating an item tied to a third-party post, and including a marker';
	}

	getExpectedFields () {
		const expectedFields = super.getExpectedFields();
		expectedFields.item.push('markerIds');
		return expectedFields;
	}

	makeItemData (callback) {
		super.makeItemData(() => {
			this.data.markers = this.markerFactory.createRandomMarkers(1, { withRandomStream: true });
			callback();
		});
	}
}

module.exports = MarkerTest;
