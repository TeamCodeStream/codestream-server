'use strict';

var Post_Direct_Stream_Test = require('./post_direct_stream_test');
var Assert = require('assert');

class Direct_Ignores_Channel_Test extends Post_Direct_Stream_Test {

	get description () {
		return 'should return a valid stream and ignore channel-related attributes when creating a direct stream';
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.name = this.stream_factory.random_name();
			callback();
		});
	}

	validate_response (data) {
		let stream = data.stream;
		Assert(typeof stream.name === 'undefined', 'name should be undefined');
		super.validate_response(data);
	}
}

module.exports = Direct_Ignores_Channel_Test;
