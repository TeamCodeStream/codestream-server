'use strict';

var Assert = require('assert');
var PostChannelStreamTest = require('./post_channel_stream_test');

class PostTeamStreamTest extends PostChannelStreamTest {

	getExpectedFields () {
		// don't expect memberIds 
		let fields = Object.assign({}, super.getExpectedFields());
		const index = fields.stream.indexOf('memberIds');
		if (index) {
			fields.stream.splice(index, 1);
		}
		return fields;
	}

	// make options to use when creating the stream for the test
	makeStreamOptions (callback) {
		// get the standard stream options, and add the isTeamStream flag
		super.makeStreamOptions(() => {
			this.streamOptions.isTeamStream = true;
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		let stream = data.stream;
		Assert(stream.isTeamStream, 'isTeamStream flag not set');
		super.validateResponse(data);
	}
}

module.exports = PostTeamStreamTest;
