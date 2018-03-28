// base class for match-repo units tests

'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Assert = require('assert');
const RandomString = require('randomstring');

class MatchRepoTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.numUsers = 3;
		this.numTeams = 2;
		this.numReposPerTeam = 2;
		this.service = Math.random() < 0.5 ? 'github.com' : 'bitbucket.org';
		this.org = RandomString.generate(8) + '.com';
		this.matches = [0];
	}

	get description () {
		return 'should return the expected info when matching a repo';
	}

	getExpectedFields () {
		return ['teams', 'teamCreators'];
	}

	dontWantToken () {
		// this is a no-auth request, no token is necessary
		return true;
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			this.createUsers,	// create some registered users
			this.createRepos,	// create a repo and team
			this.makePath		// make the path for the request test
		], callback);
	}

	// create some users for the test
	createUsers (callback) {
		this.userData = [];
		BoundAsync.times(
			this,
			this.numUsers,
			this.createUser,
			callback
		);
	}

	// create a single user for the test
	createUser (n, callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.userData.push(response);
				callback();
			}
		);
	}

	// create one or more repos
	createRepos (callback) {
		this.repos = [];
		this.teams = [];
		this.teamCreators = {};
		BoundAsync.timesSeries(
			this,
			this.numTeams * this.numReposPerTeam,
			this.createRepo,
			callback
		);
	}

	// create a repo and team for the test
	createRepo (n, callback) {
		const repoNumPerTeam = n % this.numReposPerTeam;
		const teamId = repoNumPerTeam > 0 ? this.lastTeam._id : undefined;
		const creatorNum = Math.floor(Math.random() * this.numUsers);
		const creator = this.userData[creatorNum];
		const emails = this.userData.map(userData => userData.user.email);
		emails.splice(creatorNum, 1);
		let domain, org;
		if (this.matches.includes(n)) {
			domain = this.service || this.domain;
			org = this.org;
		}
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.repos.push(response.repo);
				if (n % this.numReposPerTeam === 0) {
					this.teamCreators[response.team._id] = creator;
					this.lastTeam = response.team;
				}
				this.teams.push(this.lastTeam);
				callback();
			},
			{
				withEmails: emails,				// include all users in the team
				token: creator.accessToken,		// a random user will be the creator of the repo
				teamId: teamId,					// use this team ID, as needed
				domain: domain,					// use this domain in the url
				org: org						// use this org in the url, as in github.com/org
			}
		);
	}

	// make the path we'll use to run the test request
	makePath (callback) {
		const options = {
			domain: this.service || this.domain,
			org: this.org
		};
		const url = this.repoFactory.randomUrl(options);
		this.path = '/no-auth/match-repo?url=' + encodeURIComponent(url);
		callback();
	}

	// validate the response to the test request
	validateResponse (data) {
		this.validateTeams(data.teams);
		//		this.validateUsernames(data.usernames);
		this.validateTeamCreators(data);
	}

	// validate the teams we got back in the response
	validateTeams (teams) {
		let matches = teams.map(() => false);
		this.matches.forEach(n => {
			const expectedTeam = this.teams[n];
			const teamIndex = teams.findIndex(team => team._id === expectedTeam._id);
			const team = teams[teamIndex];
			Assert(team, `team ${n} not found in response`);
			Assert(team._id === expectedTeam._id, `incorrect _id for ${n}`);
			Assert(team.name === expectedTeam.name, `incorrect team name for ${n}`);
			Assert(Object.keys(team).length === 2, `team ${n} has other fields beside name`);
			matches[teamIndex] = true;
		});
		Assert(!matches.find(elem => elem === false), 'unexpected team found in response');
	}

	// validate the team creators we got back in the response
	validateTeamCreators (data) {
		const teams = data.teams;
		const creators = data.teamCreators;
		teams.forEach(team => {
			const expectedCreator = this.teamCreators[team._id].user;
			const creator = creators[team._id];
			Assert(creator.firstName === expectedCreator.firstName, 'returned team creator first name not correct');
			Assert(creator.lastName === expectedCreator.lastName, 'returned team creator last name not correct');
		});
		Assert(Object.keys(data.teamCreators).length === teams.length, 'number of team creators not the same as the number of team');
	}
}

module.exports = MatchRepoTest;
