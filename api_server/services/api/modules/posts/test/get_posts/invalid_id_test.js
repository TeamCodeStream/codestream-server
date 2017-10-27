'use strict';

var Get_Posts_Test = require('./get_posts_test');

class Invalid_ID_Test extends Get_Posts_Test {

	get description () {
		return 'should return an error if an invalid id is provided with a relational query parameter';
	}

	set_path (callback) {
		this.path = `/posts?team_id=${this.team._id}&stream_id=${this.stream._id}&lt=1`;
		callback();
	}

	get_expected_error () {
		return {
			code: 'RAPI-1006',
			reason: 'invalid id'
		};
	}
}

module.exports = Invalid_ID_Test;
