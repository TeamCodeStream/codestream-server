'use strict';

var File_Stream_On_The_Fly_Test = require('./file_stream_on_the_fly_test');

class No_Repo_Id_Test extends File_Stream_On_The_Fly_Test {

	get description () {
		return 'should return an error when attempting to create a post and creating a file stream on the fly with no repo_id';
	}

	get_expected_fields () {
		return null;
	}

	get_expected_error () {
		return {
			code: 'RAPI-1005',
			info: [{
				code: 'STRM-1002'
			}]
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data.stream.repo_id;
			callback();
		});
	}
}

module.exports = No_Repo_Id_Test;
