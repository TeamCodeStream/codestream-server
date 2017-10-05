'use strict';

var Assert = require('assert');
var CodeStream_API_Test = require(process.env.CI_API_TOP + '/lib/test_base/codestream_api_test');
var Team_Test_Constants = require('../team_test_constants');

class Post_Team_Test extends CodeStream_API_Test {

	get method () {
		return 'post';
	}

	get path () {
		return '/team';
	}

	get_description () {
		var type = this.name || this.random_name ? 'named' : 'unnamed';
		return `should return valid team when creating a new ${type} team`;
	}

	before (callback) {
		this.expect_fields = this.name || this.random_name ? 
			{ team: Team_Test_Constants.EXPECTED_NAMED_TEAM_FIELDS } : 
			{ team: Team_Test_Constants.EXPECTED_TEAM_FIELDS };
		this.team_factory.get_random_team_data(
			(error, users, data) => {
				if (error) { return callback(error); }
				this.created_users = users;
				this.data = data;
				callback(); 
			},
			{ 
				random_name: this.random_name,
				org: this.org
			}
		);
	}

	validate_response (data) {
		var team = data.team;
		Assert(team.creator_id === this.current_user._id, 'team creator is not the current user');
		Assert(team.member_ids instanceof Array, 'member_ids is not an array');
		if (this.named) {
			Assert(typeof team.name === 'string', 'name must be a string');
			Assert(team.name === this.data.name, 'name doesn\'t match');
		}
	}
}

module.exports = Post_Team_Test;
