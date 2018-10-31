'use strict';

const GetPostWithItemTest = require('./get_post_with_item_test');
const PostTestConstants = require('../post_test_constants');

class GetPostWithMarkerTest extends GetPostWithItemTest {

	constructor (options) {
		super(options);
		this.postOptions.wantMarker = true;
	}

	get description () {
		return 'should return a valid post with a marker when requesting a post created with a marker';
	}

	// vdlidate the response to the request
	validateResponse (data) {
		const marker = data.markers[0];
		const item = this.postData[0].item;
		// verify we got the right post, and that there are no attributes we don't want the client to see
		this.validateMatchingObject(item.markerIds[0], marker, 'marker');
		this.validateSanitized(marker, PostTestConstants.UNSANITIZED_MARKER_ATTRIBUTES);
		super.validateResponse(data);
	}
}

module.exports = GetPostWithMarkerTest;
