'use strict';

var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var CodeStream_API_Test = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');

class Get_Some_Teams_Test extends CodeStream_API_Test {

	get description () {
		return 'should return the right teams when requesting teams by IDs';
	}

	before (callback) {
		Bound_Async.series(this, [
			this.create_teams,
			this.prepare
		], callback);
	}

	create_teams (callback) {
		this.created_teams = [];
		Bound_Async.timesSeries(
			this,
			5,
			this.create_team,
			callback
		);
	}

	create_team (n, callback) {
		this.team_factory.create_random_team((error, data) => {
			if (error) { return callback(error); }
			this.created_teams.push(data.team);
			callback();
		});
	}

	prepare (callback) {
		this.team_subset = [
			this.created_teams[1],
			this.created_teams[3],
			this.created_teams[4]
		];
		let ids_subset = this.team_subset.map(team => team._id);
		this.path = '/teams?ids=' + ids_subset.join(',');
		callback();
	}

	validate_response (data) {
		this.validate_matching_objects(this.team_subset, data.teams, 'teams');
	}
}

module.exports = Get_Some_Teams_Test;
