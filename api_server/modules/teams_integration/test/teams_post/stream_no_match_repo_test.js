'use strict';

var TeamsPostTest = require('./teams_post_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class StreamNoMatchRepoTest extends TeamsPostTest {

	get description () {
		return 'should return an error when trying to send a teams post request with a stream ID and a repo ID that are not related';
	}

	getExpectedError () {
		return {
			code: 'INTG-1003',
		};
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			this.createOtherRepo,	// create another repo (and team)
			super.before			// normal test setup
		], callback);
	}

	// create a second repo (and team) ... we'll use this team and repo's ID ... this is not allowed!
	createOtherRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherTeam = response.team;
				this.otherRepo = response.repo;
				callback();
			},
			{
				token: this.token	// "current user" will create this repo/team
			}
		);
	}

	// make the data to be used in the request that triggers the message
	makePostData (callback) {
		super.makePostData(() => {
			// inject the other team and repo ID
			this.data.teamId = this.otherTeam._id;
			this.data.repoId = this.otherRepo._id;
			callback();
		});
	}
}

module.exports = StreamNoMatchRepoTest;
