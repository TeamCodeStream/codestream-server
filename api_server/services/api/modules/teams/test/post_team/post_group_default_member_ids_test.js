'use strict';

var Assert = require('assert');
var Post_Team_Test = require('./post_team_test');

const DESCRIPTION = 'should return a team with the current user as the only member when member_ids is omitted';

class Post_Team_Default_Member_IDs_Test extends Post_Team_Test {

	get_description () {
		return DESCRIPTION;
	}

	before (callback) {
		super.before((error) => {
			if (error) { return callback(error); }
			delete this.data.member_ids;
			callback();
		});
	}

	validate_response (data) {
		super.validate_response(data);
		var team = data.team;
		Assert(
			team.member_ids.length === 1 && team.member_ids[0] === this.current_user._id,
			'team must have current user as only member'
		);
	}
}

module.exports = Post_Team_Default_Member_IDs_Test;
