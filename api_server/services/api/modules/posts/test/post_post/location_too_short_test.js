'use strict';

var PostCodeToFileStreamTest = require('./post_code_to_file_stream_test');

class LocationTooShortTest extends PostCodeToFileStreamTest {

	get description () {
		return 'should return an error when attempting to create a post with a code block element where the location array is too long';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: [{
				code: 'RAPI-1005',
				info: 'codeBlocks: location array must have at least 4 elements'
			}]
		};
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.data.codeBlocks[0].location = [1, 2, 3];
			callback();
		});
	}
}

module.exports = LocationTooShortTest;
