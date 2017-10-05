'use strict';

var Assert = require('assert');
var Post_Team_Test = require('./post_team_test');

const DESCRIPTION = 'should return a team with the current user as a member when creating a team without the current user as a member';

class Post_Team_User_Should_Be_Member_Test extends Post_Team_Test {

	get_description () {
		return DESCRIPTION;
	}

	before (callback) {
		super.before((error) => {
			if (error) { return callback(error); }
			var index = this.data.member_ids.indexOf(this.current_user._id);
			if (index !== -1) {
				this.data.member_ids.splice(index, 1);
			}
			callback();
		});
	}

	validate_response (data) {
		super.validate_response(data);
		var team = data.team;
		Assert(team.member_ids.indexOf(this.current_user._id) !== -1);
	}
}

module.exports = Post_Team_User_Should_Be_Member_Test;
