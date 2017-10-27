'use strict';

var Get_Posts_Test = require('./get_posts_test');

class Invalid_Parameter_Test extends Get_Posts_Test {

	get description () {
		return 'should return an error if an unknown query parameter is provided';
	}

	set_path (callback) {
		this.path = `/posts?team_id=${this.team._id}&stream_id=${this.stream._id}&thisparam=1`;
		callback();
	}

	get_expected_error () {
		return {
			code: 'RAPI-1006',
			reason: 'invalid query parameter'
		};
	}
}

module.exports = Invalid_Parameter_Test;
