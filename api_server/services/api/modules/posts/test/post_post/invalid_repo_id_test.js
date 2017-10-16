'use strict';

var File_Stream_On_The_Fly_Test = require('./file_stream_on_the_fly_test');
var ObjectID = require('mongodb').ObjectID;

class Invalid_Repo_Id_Test extends File_Stream_On_The_Fly_Test {

	get description () {
		return 'should return an error when attempting to create a post and creating a file stream on the fly with an invalid repo id';
	}

	get_expected_fields () {
		return null;
	}

	get_expected_error () {
		return {
			code: 'RAPI-1003',
			info: 'repo'
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.stream.repo_id = ObjectID();
			callback();
		});
	}
}

module.exports = Invalid_Repo_Id_Test;
