'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var Post_Team_Test = require('./post_team_test');

const DESCRIPTION = 'should return an error if there is already a named team in the same org with the same name';

class Post_Team_Named_Team_Exists_Test extends Post_Team_Test {

	get_description () {
		return DESCRIPTION;
	}

	get_expected_error () {
		return {
			code: 'RAPI-1005',
	 	};
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
				random_name: true
			}
		);
	}

	create_new_team (callback) {
		super.before((error) => {
			if (error) { return callback(error); }
			this.data.name = this.existing_team.name;
			this.data.org_id = this.existing_team.org_id;
			callback();
		});
	}
}

module.exports = Post_Team_Named_Team_Exists_Test;
