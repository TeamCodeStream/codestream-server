'use strict';

var CodeBlockStreamOnTheFlyTest = require('./code_block_stream_on_the_fly_test');

class OnTheFlyCodeBlockStreamNoRepoIdTest extends CodeBlockStreamOnTheFlyTest {

	get description () {
		return 'should return an error when attempting to create a post with a code block with an on-the-fly stream without providing a repo ID';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'codeBlock.repoId'
		};
	}

	// before the test runs...
	before (callback) {
		// for the stream we want to create on-the-fly, remove the repo ID
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data.codeBlocks[0].repoId;
			callback();
		});
	}
}

module.exports = OnTheFlyCodeBlockStreamNoRepoIdTest;
