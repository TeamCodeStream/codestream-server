'use strict';

var GetReposTest = require('./get_repos_test');

class ACLTest extends GetReposTest {

	get description () {
		return 'should return an error when trying to fetch repos from a team i\'m not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}

	setPath (callback) {
		let teamId = this.foreignTeam._id;
		let ids = this.foreignRepo._id;
		this.path = `/repos?teamId=${teamId}&ids=${ids}`;
		callback();
	}
}

module.exports = ACLTest;
