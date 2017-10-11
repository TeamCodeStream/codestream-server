'use strict';

var Post_Repo_Test = require('./post_repo_test');
var ObjectID = require('mongodb').ObjectID;

class Team_Not_Found_Test extends Post_Repo_Test {

	get_description () {
		return `should return error when attempting to create a repo with a bad team id`;
	}

	get_expected_fields () {
		return null;
	}

	get_expected_error () {
		return {
			code: 'RAPI-1003',
			info: 'team'
		};
	}

	before (callback) {
		super.before(() => {
			delete this.data.team;
			this.data.team_id = ObjectID();
			callback();
		});
	}
}

module.exports = Team_Not_Found_Test;
