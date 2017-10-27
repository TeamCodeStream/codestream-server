'use strict';

var Get_Streams_Test = require('./get_streams_test');

class Get_Streams_By_Repo_Id_And_Ids_Test extends Get_Streams_Test {

	get description () {
		return 'should return the correct streams when requesting streams by repo ID and IDs';
	}

	set_path (callback) {
		let team_id = this.my_team._id;
		let repo_id = this.my_repo._id;
		this.my_streams = [
			this.streams_by_repo[repo_id][0],
			this.streams_by_repo[repo_id][2]
		];
		let ids = this.my_streams.map(stream => stream._id);
		this.path = `/streams?team_id=${team_id}&repo_id=${repo_id}&ids=${ids}`;
		callback();
	}
}

module.exports = Get_Streams_By_Repo_Id_And_Ids_Test;
