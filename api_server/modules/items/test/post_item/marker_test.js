'use strict';

const PostItemTest = require('./post_item_test');
const DeepClone = require(process.env.CS_API_TOP + '/server_utils/deep_clone');

class MarkerTest extends PostItemTest {

	get description () {
		return 'should return a valid item with marker data when creating an item tied to a third-party post, and including a marker';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.repoOptions.creatorIndex = 1;
			this.expectMarker = true;
			callback();
		});
	}

	getExpectedFields () {
		const expectedFields = DeepClone(super.getExpectedFields());
		expectedFields.item.push('markerIds');
		return expectedFields;
	}

	makeItemData (callback) {
		super.makeItemData(() => {
			this.data.markers = this.markerFactory.createRandomMarkers(1, { fileStreamId: this.repoStreams[0]._id });
			callback();
		});
	}
}

module.exports = MarkerTest;
