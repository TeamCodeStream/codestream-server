'use strict';

var Get_Streams_Test = require('./get_streams_test');

class Get_Some_Streams_Test extends Get_Streams_Test {

	get description () {
		return 'should return the correct streams when requesting streams by ID';
	}

	set_path (callback) {
		this.my_streams = [
			this.streams_by_team[this.teams[0]._id][0],
			this.streams_by_team[this.teams[1]._id][0],
			this.streams_by_repo[this.repos[0]._id][0],
			this.streams_by_repo[this.repos[1]._id][1]
		];
		let ids = this.my_streams.map(stream => stream._id);
		this.path = '/streams?ids=' + ids;
		callback();
	}
}

module.exports = Get_Some_Streams_Test;
