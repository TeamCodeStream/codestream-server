'use strict';

var PostCodeToFileStreamTest = require('./post_code_to_file_stream_test');

class LocationMustBeArrayTest extends PostCodeToFileStreamTest {

	get description () {
		return 'should return an error when attempting to create a post with a code block element where the location is not an array';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'codeBlocks: location must be an array'
		};
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.data.codeBlocks[0].location = 1;
			callback();
		});
	}
}

module.exports = LocationMustBeArrayTest;
