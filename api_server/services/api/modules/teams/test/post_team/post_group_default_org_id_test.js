'use strict';

var Assert = require('assert');
var Post_Team_Test = require('./post_team_test');

class Post_Team_Default_Org_ID_Test extends Post_Team_Test {

	get description () {
		return 'should return a team with the current user as the only member when member_ids is omitted';
	}

	before (callback) {
		super.before((error) => {
			if (error) { return callback(error); }
			delete this.data.org_id;
			callback();
		});
	}

	validate_response (data) {
		super.validate_response(data);
		let team = data.team;
		Assert(
			team.org_id === this.current_user.org_ids[0],
			'team must have current user\'s one and only org as org_id'
		);
	}
}

module.exports = Post_Team_Default_Org_ID_Test;
