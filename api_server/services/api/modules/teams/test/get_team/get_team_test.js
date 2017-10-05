'use strict';

var CodeStream_API_Test = require(process.env.CI_API_TOP + '/lib/test_base/codestream_api_test');
var Team_Test_Constants = require('../team_test_constants');

const DESCRIPTION = 'should return a valid team when requesting a team';

class Get_Team_Test extends CodeStream_API_Test {

	get_description () {
		return DESCRIPTION;
	}

	get_expected_fields () {
		return { team: Team_Test_Constants.EXPECTED_TEAM_FIELDS };
	}

	before (callback) {
		this.team_factory.create_random_team((error, data) => {
			if (error) { return callback(error); }
			this.created_team = data.team;
			this.path = '/team/' + data.team._id;
			callback();
		});
	}

	validate_response (data) {
		return this.validate_matching_object(this.created_team._id, data.team, 'team');
	}
}

module.exports = Get_Team_Test;
