'use strict';

var Get_Streams_Test = require('./get_streams_test');

class Get_Streams_Only_From_Repo_Test extends Get_Streams_Test {

	get description () {
		return 'should return the correct streams when requesting streams by ID';
	}

	set_path (callback) {
		let team_id = this.my_team._id;
		let repo_id = this.my_repo._id;
		let foreign_repo_id = this.foreign_repo._id;
		this.my_streams = [
			this.streams_by_repo[repo_id][0],
			this.streams_by_repo[repo_id][2]
		];
		let other_streams = [
			this.streams_by_repo[foreign_repo_id][1],
		];
		let all_streams = [...this.my_streams, ...other_streams];
		let ids = all_streams.map(stream => stream._id);
		this.path = `/streams?team_id=${team_id}&repo_id=${repo_id}&ids=${ids}`;
		callback();
	}
}

module.exports = Get_Streams_Only_From_Repo_Test;
