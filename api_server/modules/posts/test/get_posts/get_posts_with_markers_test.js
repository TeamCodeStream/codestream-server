'use strict';

const GetPostsWithItemsTest = require('./get_posts_with_items_test');
const Assert = require('assert');

class GetPostsWithMarkersTest extends GetPostsWithItemsTest {

	constructor (options) {
		super(options);
		this.postOptions.wantMarker = true;
	}

	get description () {
		return 'should return the correct posts with markers when requesting posts created with markers';
	}

	// validate the response to the fetch request
	validateResponse (data) {
		data.posts.forEach(post => {
			const item = data.items.find(item => item._id === post.itemId);
			item.markerIds.forEach(markerId => {
				const marker = data.markers.find(marker => marker._id === markerId);
				Assert(marker, 'marker not returned with post');
			});
		});
		super.validateResponse(data);
	}
}

module.exports = GetPostsWithMarkersTest;
