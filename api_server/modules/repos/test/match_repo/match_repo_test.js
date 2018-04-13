// base class for match-repo units tests

'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Assert = require('assert');
const RandomString = require('randomstring');
const { KNOWN_GIT_SERVICES } = require('../../extract_company_identifier');

class MatchRepoTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.numUsers = 3;
		this.numTeams = 2;
		this.numReposPerTeam = 2;
		const services = Object.keys(KNOWN_GIT_SERVICES);
		const serviceIndex = Math.floor(Math.random() * services.length);
		this.service = services[serviceIndex];
		this.org = RandomString.generate(12);
		this.matches = [0];
	}

	get description () {
		return 'should return the expected info when matching a repo';
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
		if (this.matches.includes(n) && !this.wantExactMatch) {
			domain = this.service || `${RandomString.generate(4)}.${this.domain}`;
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
				if (this.wantExactMatch && this.matches.includes(n)) {
					this.url = response.repo.url;
				}
				this.teams.push(this.lastTeam);
				callback();
			},
			{
				withEmails: emails,				// include all users in the team
				token: creator.accessToken,		// a random user will be the creator of the repo
				teamId: teamId,					// use this team ID, as needed
				domain: domain,					// use this domain in the url
				org: org,						// use this org in the url, as in github.com/org
				numKnownCommitHashes: this.numKnownCommitHashes	// can have multiple known commit hashes, as needed
			}
		);
	}

	// get query parameters used to make the path
	getQueryParameters () {
		const options = {
			domain: this.service || `${RandomString.generate(4)}.${this.domain}`,
			org: this.org
		};
		const url = this.url || this.repoFactory.randomUrl(options);
		const repo = this.matches.length > 0 ?
			this.repos[this.matches[0]] :
			this.repos[0];
		const knownCommitHashes = [repo.knownCommitHashes[0]];
		return { url, knownCommitHashes };
	}

	// make the path we'll use to run the test request
	makePath (callback) {
		const queryParameters = this.getQueryParameters();
		this.path = '/no-auth/match-repo?' + Object.keys(queryParameters).map(param => {
			const value = encodeURIComponent(queryParameters[param]);
			return `${param}=${value}`;
		}).join('&');
		callback();
	}

	// validate the response to the test request
	validateResponse (data) {
		if (this.service) {
			Assert(data.knownService === KNOWN_GIT_SERVICES[this.service], 'service not correct');
			Assert(data.org === this.org.toLowerCase(), 'org not correct');
		}
		if (this.domain) {
			Assert(data.domain === this.domain.toLowerCase(), 'domain not correct');
		}
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
