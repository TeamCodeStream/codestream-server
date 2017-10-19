'use strict';

var Get_Streams_Test = require('./get_streams_test');

class Get_File_Streams_By_Repo_Test extends Get_Streams_Test {

	get description () {
		return 'should return the correct streams when requesting file streams by repo ID';
	}

	set_path (callback) {
		let repo_id = this.repos[2]._id;
		this.my_streams = this.streams_by_repo[repo_id];
		this.path = '/streams?type=file&repo_id=' + repo_id;
		callback();
	}
}

module.exports = Get_File_Streams_By_Repo_Test;
