'use strict';

const PostStreamTest = require('./post_stream_test');

class PostStreamDeprecatedTest extends PostStreamTest {

	get description () {
		return `should return error when attempting to create a ${this.type} stream, support is deprecated`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1016'
		};
	}
}

module.exports = PostStreamDeprecatedTest;
