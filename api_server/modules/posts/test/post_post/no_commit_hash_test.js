'use strict';

const CodeBlockFromDifferentStreamTest = require('./code_block_from_different_stream_test');

class NoCommitHashTest extends CodeBlockFromDifferentStreamTest {

	constructor (options) {
		options = Object.assign(options || {}, { streamType: 'channel' });
		super(options);
		this.dontExpectMarkers = true;
	}

	get description () {
		return 'should be ok to create a post with a code block but not providing a commit hash as long as there is also no stream';
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// remove the commit hash from the data to use in creating the post
		// also remove the stream ID, making the statement that we are not associating the code block with a stream at all
		super.makePostData(() => {
			delete this.data.commitHashWhenPosted;
			delete this.data.codeBlocks[0].streamId;	
			callback();
		});
	}
}

module.exports = NoCommitHashTest;
