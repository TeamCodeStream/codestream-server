'use strict';

var Post_Post_Test = require('./post_post_test');

class No_Stream_Id_Test extends Post_Post_Test {

	get description () {
		return 'should return error when attempting to create a stream with no stream id';
	}

	get_expected_fields () {
		return null;
	}

	get_expected_error () {
		return {
			code: 'RAPI-1002',
			info: 'stream_id'
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data.stream_id;
			callback();
		});
	}
}

module.exports = No_Stream_Id_Test;
