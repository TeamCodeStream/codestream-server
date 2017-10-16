'use strict';

var Post_Channel_Stream_Test = require('./post_channel_stream_test');

class Duplicate_Channel_Test extends Post_Channel_Stream_Test {

	constructor (options) {
		super(options);
		this.test_options.want_duplicate_stream = true;
	}

	get description () {
		return 'should return an error when trying to create a channel stream with a name that is already taken';
	}

	get_expected_fields () {
		return null;
	}

	get_expected_error () {
		return {
			code: 'RAPI-1004',
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.name = this.duplicate_stream.name;
			callback();
		});
	}
}

module.exports = Duplicate_Channel_Test;
