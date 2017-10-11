'use strict';

var Post_Team_Test = require('./post_team_test');

class Post_Team_Invalid_Member_IDs_Test extends Post_Team_Test {

	get description () {
		return 'should return an error if the member_ids array is invalid';
	}

	get_expected_error () {
		return {
			code: 'RAPI-1006',
			info: [{
				member_ids: 'must be an array'
			}]
		};
	}

	before (callback) {
		super.before((error) => {
			if (error) { return callback(error); }
			this.data.member_ids = 'foo';
			callback();
		});
	}
}

module.exports = Post_Team_Invalid_Member_IDs_Test;
