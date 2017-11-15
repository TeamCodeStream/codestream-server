'use strict';

var PostFileStreamTest = require('./post_file_stream_test');

class NoAttributeTest extends PostFileStreamTest {

	get description () {
		return `should return error when attempting to create a stream with no ${this.attribute}`;
	}

	getExpectedFields () {
		return null;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1002',
			info: this.attribute
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data[this.attribute];
			callback();
		});
	}
}

module.exports = NoAttributeTest;
