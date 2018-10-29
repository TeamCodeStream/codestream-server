'use strict';

const GetPostlessMarkersTest = require('./get_postless_markers_test');
const Assert = require('assert');
const RandomString = require('randomstring');

class GetPostlessMarkersWithItemsTest extends GetPostlessMarkersTest {

	constructor (options) {
		super(options);
		this.wantCodeBlock = true;
	}

	get description () {
		return 'should return the correct markers with items when requesting markers for a team and the markers are for third-party provider and were created with associated items';
	}

	createMarker (n, callback) {
		// to create a marker with an associated item, we actually create the item with a code block
		const data = this.itemFactory.getRandomItemData();
		Object.assign(data, {
			teamId: this.team._id,
			providerType: 'slack',
			streamId: RandomString.generate(10),
			postId: RandomString.generate(10)
		});
		this.postFactory.createRandomCodeBlocks(data, 1, { codeBlockStreamId: this.repoStreams[0]._id, randomCommitHash: true });
		this.doApiRequest(
			{
				method: 'post',
				path: '/items',
				data,
				token: this.users[1].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.postData.push({ 
					markers: [ response.markers[0] ],
					markerLocations: response.markerLocations
				});
				callback();
			}
		);
	}

	// validate correct response
	validateResponse (data) {
		data.markers.forEach(marker => {
			if ((marker.itemIds || []).length) {
				Assert.deepEqual(marker.itemIds, [marker.items[0]._id], 'marker does not have correct items for its itemIds');
			}
		});
		super.validateResponse(data);
	}
}

module.exports = GetPostlessMarkersWithItemsTest;
