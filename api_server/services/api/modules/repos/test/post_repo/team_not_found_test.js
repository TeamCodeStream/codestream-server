'use strict';

var PostRepoTest = require('./post_repo_test');
var ObjectID = require('mongodb').ObjectID;

class TeamNotFoundTest extends PostRepoTest {

	get description () {
		return `should return error when attempting to create a repo with a bad team id`;
	}

	getExpectedFields () {
		return null;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011'
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data.team;
			this.data.teamId = ObjectID();
			callback();
		});
	}
}

module.exports = TeamNotFoundTest;
