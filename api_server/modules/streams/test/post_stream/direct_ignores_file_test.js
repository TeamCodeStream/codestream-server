'use strict';

var PostDirectStreamTest = require('./post_direct_stream_test');
var Assert = require('assert');

class DirectIgnoresFileTest extends PostDirectStreamTest {

	get description () {
		return 'should return a valid stream and ignore file-related attributes when creating a direct stream';
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.file = this.streamFactory.randomFile();
			this.data.repoId = this.repo._id;
			callback();
		});
	}

	validateResponse (data) {
		let stream = data.stream;
		Assert(typeof stream.file === 'undefined', 'file should be undefined');
		Assert(typeof stream.repoId === 'undefined', 'repoId should be undefined');
		super.validateResponse(data);
	}
}

module.exports = DirectIgnoresFileTest;
