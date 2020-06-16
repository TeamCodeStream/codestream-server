'use strict';

const GetCodemarksWithMarkersTest = require('./get_codemarks_with_markers_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class GetCodemarksByFileStreamIdTest extends GetCodemarksWithMarkersTest {

	constructor (options) {
		super(options);
		this.repoOptions.creatorIndex = 1;
		this.postOptions.markerStreamId = 0;
	}

	get description () {
		return 'should return the correct codemarks when requesting codemarks for a team and by file stream ID';
	}

	setPath (callback) {
		// set path, but create some more posts referencing another file,
		// and make sure we don't see any of those posts
		BoundAsync.series(this, [
			super.setPath,
			this.createOtherPosts
		], callback);
	}

	createOtherPosts (callback) {
		this.path = `/codemarks?teamId=${this.team.id}&fileStreamId=${this.repoStreams[0].id}`;
		BoundAsync.timesSeries(
			this,
			5,
			this.createOtherPost,
			callback
		);
	}

	createOtherPost (n, callback) {
		this.postFactory.createRandomPost(
			callback,
			{
				streamId: this.stream.id,
				token: this.users[1].accessToken,
				wantCodemark: true, 
				wantMarkers: true
			}
		);
	}
	
	// validate correct response
	validateResponse (data) {
		data.codemarks.forEach(codemark => {
			Assert.deepEqual(codemark.fileStreamIds, [this.repoStreams[0].id], 'got a codemark with non-matching stream ID');
		});
		super.validateResponse(data);
	}
}

module.exports = GetCodemarksByFileStreamIdTest;
