'use strict';

var Post_Post_Test = require('./post_post_test');
var ObjectID = require('mongodb').ObjectID;

class Invalid_Stream_Id_Test extends Post_Post_Test {

	get description () {
		return 'should return error when attempting to create a post with an invalid stream id';
	}

	get_expected_fields () {
		return null;
	}

	get_expected_error () {
		return {
			code: 'RAPI-1003',
			info: 'stream'
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.stream_id = ObjectID();
			callback();
		});
	}
}

module.exports = Invalid_Stream_Id_Test;
