'use strict';

const CodeBlockStreamOnTheFlyTest = require('./code_block_stream_on_the_fly_test');

class OnTheFlyCodeBlockStreamInvalidRepoIdTest extends CodeBlockStreamOnTheFlyTest {

	get description () {
		return 'should return an error when attempting to create a post with a code block with an on-the-fly stream with a bogus repo id';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'repo'
		};
	}

	// before the test runs...
	before (callback) {
		// for the stream we want to create on-the-fly, substitute a bogus ID for the repo
		super.before(error => {
			if (error) { return callback(error); }
			this.data.codeBlocks[0].repoId = 'x';
			callback();
		});
	}
}

module.exports = OnTheFlyCodeBlockStreamInvalidRepoIdTest;
