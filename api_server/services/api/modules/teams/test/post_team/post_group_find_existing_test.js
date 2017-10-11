'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var Assert = require('assert');
var Post_Team_Test = require('./post_team_test');

class Post_Team_Find_Existing_Test extends Post_Team_Test {

	get description () {
		return 'should return the same team when trying to create a team with the same members';
	}

	before (callback) {
		Bound_Async.series(this, [
			this.create_existing_team,
			this.create_new_team
		], callback);
	}

	create_existing_team (callback) {
		this.team_factory.create_random_team(
			(error, data) => {
				if (error) { return callback(error); }
				this.existing_team = data.team;
				callback();
			},
			{
				org: this.current_orgs[0],
				token: this.token
			}
		);
	}

	create_new_team (callback) {
		this.org = this.current_orgs[0];
		super.before((error) => {
			if (error) { return callback(error); }
			delete this.data.org_id;
			this.data.member_ids = this.existing_team.member_ids;
			callback();
		});
	}

	validate_response (data) {
		let team = data.team;
		Assert(team._id === this.existing_team._id, '_id of the returned team should equal _id of team with same members');
	}
}

module.exports = Post_Team_Find_Existing_Test;
