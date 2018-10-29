'use strict';

const GetPostlessMarkerTest = require('./get_postless_marker_test');
const MarkerTestConstants = require('../marker_test_constants');
const RandomString = require('randomstring');

class GetPostlessMarkerWithItemTest extends GetPostlessMarkerTest {

	get description () {
		return 'should return the marker with items when requesting a postless marker associated with items and created for a third-party provider';
	}

	// create the marker to fetch
	createMarker (callback) {
		// to create a marker associated with an item, we actually have to create the item
		const data = this.makeItemData();
		this.doApiRequest(
			{
				method: 'post',
				path: '/items',
				data,
				token: this.users[1].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.marker = response.markers[0];
				this.path = '/markers/' + this.marker._id;
				callback();
			}
		);
	}

	// make the data for the item to be created for the test
	makeItemData () {
		const data = this.itemFactory.getRandomItemData();
		Object.assign(data, {
			teamId: this.team._id,
			providerType: 'slack',
			streamId: RandomString.generate(10),
			postId: RandomString.generate(10)
		});
		this.postFactory.createRandomCodeBlocks(data, 1, { withRandomStream: true, randomCommitHash: true });
		return data;
	}

	// validate the request response
	validateResponse (data) {
		// validate we got an item, and that we only got sanitized attributes
		const marker = data.marker;
		const item = marker.items[0];
		this.validateMatchingObject(marker.itemIds[0], item, 'item');
		this.validateSanitized(item, MarkerTestConstants.UNSANITIZED_ITEM_ATTRIBUTES);
		super.validateResponse(data);
	}
}

module.exports = GetPostlessMarkerWithItemTest;
