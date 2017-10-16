'use strict';

var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Assert = require('assert');
var CodeStream_API_Test = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');

class Get_My_Teams_Test extends CodeStream_API_Test {

	get description () {
		return 'should return teams i am a member of when requesting my teams';
	}

	get path () {
		return '/teams/~';
	}

	before (callback) {
		this.created_teams = [];
		Bound_Async.timesSeries(
			this,
			5,
			this.create_team,
			callback
		);
	}

	create_team (n, callback) {
		this.team_factory.create_random_team(
			(error, data) => {
				if (error) { return callback(error); }
				this.created_teams.push(data.team);
				callback();
			},
			{
				org: this.current_orgs[0],
				token: this.token
			}
		);
	}

	validate_response (data) {
		Assert(data.teams.length === this.created_teams.length, 'number of teams should match number created');
		return this.validate_matching_objects(this.created_teams, data.teams, 'teams');
	}
}

module.exports = Get_My_Teams_Test;
