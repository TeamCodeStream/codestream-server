'use strict';

var PostPostTest = require('./post_post_test');
var Assert = require('assert');

class CodeBlockFromDifferentStreamTest extends PostPostTest {

	get description () {
		return `should return a valid post when creating a post in a ${this.streamType} stream referencing a code block from another stream`;
	}

	createOtherFileStream (callback) {
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherFileStream = response.stream;
				callback();
			},
			{
				type: 'file',
				teamId: this.team._id,
				repoId: this.repo._id,
				token: this.otherUserData.accessToken
			}
		);
	}

	makeStreamOptions (callback) {
		super.makeStreamOptions(() => {
			this.streamOptions.repoId = this.repo._id;
			callback();
		});
	}

	makePostData (callback) {
		this.createOtherFileStream(error => {
			if (error) { return callback(error); }
			Object.assign(this.postOptions, {
				wantCodeBlocks: 1,
				codeBlockStreamId: this.otherFileStream._id
			});
			super.makePostData(callback);
		});
	}

	validateResponse (data) {
		let post = data.post;
		let marker = data.markers[0];
		Assert(marker.streamId === this.otherFileStream._id, 'streamId of marker does not match the other file stream ID');
		Assert(post.streamId !== marker.streamId, 'the streamId of the post and the streamId of the marker are the same');
		super.validateResponse(data);
	}
}

module.exports = CodeBlockFromDifferentStreamTest;
