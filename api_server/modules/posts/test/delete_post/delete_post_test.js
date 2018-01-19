// base class for many tests of the "PUT /posts" requests

'use strict';

var Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
var Assert = require('assert');
var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var CommonInit = require('./common_init');
const PostTestConstants = require('../post_test_constants');

class DeletePostTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should return the deactivated post when deleting a post';
	}

	get method () {
		return 'delete';
	}

	getExpectedFields () {
		return { post: ['deactivated', 'modifiedAt'] };
	}

	// before the test runs...
	before (callback) {
		this.init(callback);
	}

	// validate the response to the test request
	validateResponse (data) {
		// verify we got back a post with the deactivated flag set, and also modifiedAt updated
        let post = data.post;
        Assert(post._id === this.post._id, 'returned post ID is not the same');
        Assert(post.deactivated, 'deactivated flag was not set');
        Assert(post.modifiedAt > this.modifiedAfter, 'modifiedAt is not greater than before the post was edited');
		// verify the post in the response has no attributes that should not go to clients
		this.validateSanitized(post, PostTestConstants.UNSANITIZED_ATTRIBUTES);
		// validate any markers deleted as well
		this.validateMarkers(data);
	}

	// validate any markers associated with the post were also deactivated
	validateMarkers (data) {
		if (!this.wantCodeBlocks) {
			return;
		}
		Assert(data.markers, 'no marker updates in response');
		Assert(data.markers.length === this.wantCodeBlocks, 'did not get the same number of markers as code blocks created');
		for (let i = 0; i < this.wantCodeBlocks.length; i++) {
			this.validateMarker(data.markers[i]);
		}
	}

	// validate a single marker associated with the post, that should be deactivated
	validateMarker (marker) {
		let codeBlock = this.post.codeBlocks.find(postCodeBlock => postCodeBlock.markerId === marker._id);
		Assert(codeBlock, 'got an updated marker that does not corresponed to a code block');
		Assert(marker.deactivated, 'deactivated flag was not set for marker ' + marker._id);
		this.validateSanitized(marker, PostTestConstants.UNSANITIZED_MARKER_ATTRIBUTES);
	}
}

module.exports = DeletePostTest;
