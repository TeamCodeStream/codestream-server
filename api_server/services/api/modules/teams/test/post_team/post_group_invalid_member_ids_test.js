'use strict';

var Post_Team_Test = require('./post_team_test');

const DESCRIPTION = 'should return an error if the member_ids array is invalid';

class Post_Team_Invalid_Member_IDs_Test extends Post_Team_Test {

	get_description () {
		return DESCRIPTION;
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
