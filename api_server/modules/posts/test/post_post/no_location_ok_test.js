'use strict';

const CodeBlockTest = require('./code_block_test');

class NoLocationOkTest extends CodeBlockTest {

	get description () {
		return 'should accept the post and return it when no location is given with a code block';
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// completely remove the location, this is permitted
		super.makePostData(() => {
			delete this.data.codeBlocks[0].location;
			callback();
		});
	}
}

module.exports = NoLocationOkTest;
