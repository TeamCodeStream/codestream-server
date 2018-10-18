'use strict';

const CodeBlockTest = require('./code_block_test');

class LocationMustBeArrayTest extends CodeBlockTest {

	get description () {
		return 'should return an error when attempting to create a post with a code block element where the location is not an array';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'invalid location'
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// set the location for the code block to a "numeric" ... not allowed!
		super.makePostData(() => {
			this.data.codeBlocks[0].location = 1;
			callback();
		});
	}
}

module.exports = LocationMustBeArrayTest;
