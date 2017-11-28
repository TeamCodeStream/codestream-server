'use strict';

var PostCodeToFileStreamTest = require('./post_code_to_file_stream_test');
var Assert = require('assert');
const PostTestConstants = require('../post_test_constants');

class CodeBlockTest extends PostCodeToFileStreamTest {

	get description () {
		return 'should return the post with marker info when creating a post with code block info in a file stream';
	}

	validateResponse (data) {
		let post = data.post;
		Assert(data.markers instanceof Array, 'no markers array');
		Assert(data.markers.length === 1, 'length of markers array is ' + data.markers.length);
		let marker = data.markers[0];
		Assert(marker.teamId === post.teamId, 'teamId does not match');
		Assert(marker.streamId === post.streamId, 'streamId does not match');
		Assert(marker.postId === post._id, 'postId does not match');
		Assert(marker.deactivated === false, 'deactivated is not false');
		Assert.deepEqual(this.data.codeBlocks[0].location, marker.location, 'location does not match');
		Assert(marker._id === post.codeBlocks[0].markerId, 'markerId in code block does not match marker created');
		Assert(marker.commitHash === post.commitHashWhenPosted, 'commitHash does not match the commitHash of the post');
		this.validateSanitized(marker, PostTestConstants.UNSANITIZED_MARKER_ATTRIBUTES);
		super.validateResponse(data);
	}
}

module.exports = CodeBlockTest;
