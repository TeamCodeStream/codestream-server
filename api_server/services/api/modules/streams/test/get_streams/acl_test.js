'use strict';

var Get_Streams_Test = require('./get_streams_test');

class ACL_Test extends Get_Streams_Test {

	get description () {
		return 'should return an error when trying to fetch streams from a team i\'m not a member of';
	}

	get_expected_error () {
		return {
			code: 'RAPI-1009'
		};
	}

	set_path (callback) {
		let team_id = this.foreign_team._id;
		let streams = [
			this.streams_by_team[this.foreign_team._id][0],
			this.streams_by_repo[this.foreign_repo._id][1],
		];
		let ids = streams.map(stream => stream._id);
		this.path = `/streams?team_id=${team_id}&ids=${ids}`;
		callback();
	}
}

module.exports = ACL_Test;
