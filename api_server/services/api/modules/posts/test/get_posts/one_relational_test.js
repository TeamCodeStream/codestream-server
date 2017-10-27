'use strict';

var Get_Posts_Test = require('./get_posts_test');
var ObjectID = require('mongodb').ObjectID;

class One_Relational_Test extends Get_Posts_Test {

	get description () {
		return 'should return an error if more than one relational query parameter is provided';
	}

	set_path (callback) {
		let id1 = ObjectID();
		let id2 = ObjectID();
		this.path = `/posts?team_id=${this.team._id}&stream_id=${this.stream._id}&lt=${id1}&gt=${id2}`;
		callback();
	}

	get_expected_error () {
		return {
			code: 'RAPI-1006',
			reason: 'only one relational parameter allowed'
		};
	}
}

module.exports = One_Relational_Test;
