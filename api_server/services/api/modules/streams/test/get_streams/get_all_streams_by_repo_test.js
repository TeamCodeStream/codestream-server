'use strict';

var Get_Streams_Test = require('./get_streams_test');

class Get_All_Streams_By_Repo_Test extends Get_Streams_Test {

	get description () {
		return 'should return the correct streams when requesting all streams by repo ID';
	}

	set_path (callback) {
		let repo_id = this.my_repo._id;
		let team_id = this.my_team._id;
		this.my_streams = this.streams_by_repo[repo_id];
		this.path = `/streams?team_id=${team_id}&repo_id=${repo_id}`;
		callback();
	}
}

module.exports = Get_All_Streams_By_Repo_Test;
