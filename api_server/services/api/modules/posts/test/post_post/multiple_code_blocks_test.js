'use strict';

var Assert = require('assert');
var PostCodeToFileStreamTest = require('./post_code_to_file_stream_test');
const PostTestConstants = require('../post_test_constants');

class MultipleCodeBlocksTest extends PostCodeToFileStreamTest {

	constructor (options) {
		super(options);
		this.numCodeBlocks = 3;
	}

	get description () {
		return 'should see all the markers when a post is created in the stream with multiple code blocks';
	}

	makePostOptions (callback) {
		super.makePostOptions(() => {
			this.postOptions.wantCodeBlocks = this.numCodeBlocks;
			callback();
		});
	}

	validateResponse (data) {
		let post = data.post;
		Assert(data.markers instanceof Array, 'no markers array');
		Assert(data.markers.length === this.numCodeBlocks, 'length of markers array is not equal to the number of code blocks, it is ' + data.markers.length);
		for (let i = 0; i < this.numCodeBlocks; i++) {
			let marker = data.markers[i];
			Assert(marker.teamId === post.teamId, 'teamId does not match');
			Assert(marker.streamId === post.streamId, 'streamId does not match');
			Assert(marker.postId === post._id, 'postId does not match');
			Assert(marker.deactivated === false, 'deactivated is not false');
			Assert.deepEqual(this.data.codeBlocks[i].location, marker.location, 'location does not match');
			Assert(marker._id === post.codeBlocks[i].markerId, 'markerId in code block does not match marker created');
			Assert(marker.commitHash === post.commitHashWhenPosted, 'commitHash does not match the commitHash of the post');
			this.validateSanitized(marker, PostTestConstants.UNSANITIZED_MARKER_ATTRIBUTES);
		}
		super.validateResponse(data);
	}
}

module.exports = MultipleCodeBlocksTest;
