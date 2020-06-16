'use strict';

const GetPostsWithCodemarksTest = require('./get_posts_with_codemarks_test');
const Assert = require('assert');

class GetPostsWithMarkersTest extends GetPostsWithCodemarksTest {

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
			const codemark = data.codemarks.find(codemark => codemark.id === post.codemarkId);
			codemark.markerIds.forEach(markerId => {
				const marker = data.markers.find(marker => marker.id === markerId);
				Assert(marker, 'marker not returned with post');
			});
		});
		super.validateResponse(data);
	}
}

module.exports = GetPostsWithMarkersTest;
