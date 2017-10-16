'use strict';

var Post_Channel_Stream_Test = require('./post_channel_stream_test');

class Name_Required_Test extends Post_Channel_Stream_Test {

	get description () {
		return 'should return an error when attempting to create a channel stream with no name';
	}

	get_expected_fields () {
		return null;
	}

	get_expected_error () {
		return {
			code: 'RAPI-1005',
			info: [{
				code: 'STRM-1001'
			}]
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data.name;
			callback();
		});
	}
}

module.exports = Name_Required_Test;
