// handle the 'GET /no-auth/match-repo' request, to find one or more matches for a repo
// among already-known teams ... we'll look at the url and try to find similar urls
// already owned by other teams

'use strict';

var RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var NormalizeURL = require('./normalize_url');
const Indexes = require('./indexes');
const UserIndexes = require(process.env.CS_API_TOP + '/modules/users/indexes');

const KNOWN_GIT_SERVICES = ['github.com', 'bitbucket.org'];

class MatchRepoRequest extends RestfulRequest {

	authorize (callback) {
		return callback(false);	// no ACL check needed, this is an unsecured request
	}

	process (callback) {
		BoundAsync.series(this, [
			this.require,			// handle required request parameters
			this.parseUrl,			// parse the input url for relevant details
			this.findRepo,			// attempt to find the repo
			this.getTeams,			// get the teams owning the repo(s) we found
			//			this.getUsernames,		// get the unique usernames for the team that owns the repo
			//			this.classifyUsernames,	// classify the usernames by team
			//			this.getTeamCreators	// get the creators of the teams
			this.fetchTeamCreators,	// fetch the creators of the teams
			this.classifyTeamCreators,	// classify team creators by team ID
			this.formResponse		// form the request response
		], callback);
	}

	// these parameters are required for the request
	require (callback) {
		this.requireAllowParameters(
			'query',
			{
				required: {
					string: ['url']
				}
			},
			callback
		);
	}

	// parse the incoming url for relevant details
	parseUrl (callback) {
		this.normalizedUrl = NormalizeURL(decodeURIComponent(this.request.query.url));
		if (
			!this.checkKnownService() &&
			!this.extractDomain()
		) {
			// short-circuit the request, we're not going to find a match
			this.noMatches = true;
		}
		process.nextTick(callback);
	}

	// check if the url is associated with a known service, like github, and if
	// so, parse and extract contents
	checkKnownService () {
		return KNOWN_GIT_SERVICES.find(service => {
			const escapedService = service.replace('.', '\\.');
			const regExp = new RegExp(`^${escapedService}/(.+?)/`);
			const match = this.normalizedUrl.match(regExp);
			if (match && match.length > 1) {
				this.service = service;
				this.org = match[1];
				return true;
			}
		});
	}

	// extract the domain part of the url
	extractDomain () {
		const match = this.normalizedUrl.match(/^(.+?)\//);
		if (match && match.length > 1) {
			this.domain = match[1];
			return true;
		}
	}

	// attempt to find any matching repos
	findRepo (callback) {
		if (this.noMatches) {
			// we already know there will be no matches
			this.repos = [];
			return callback();
		}
		let regExp;
		if (this.service) {
			const escapedService = this.service.replace('.', '\\.');
			const escapedOrg = this.org.replace('.', '\\.');
			regExp = new RegExp(`^${escapedService}/${escapedOrg}/`);
		}
		else {
			const escapedDomain = this.domain.replace('.', '\\.');
			regExp = new RegExp(`^${escapedDomain}/`);
		}
		const query = {
			normalizedUrl: regExp
		};
		this.data.repos.getByQuery(
			query,
			(error, repos) => {
				if (error) { return callback(error); }
				this.repos = repos.filter(repo => !repo.deactivated);
				callback();
			},
			{
				databaseOptions: {
					fields: ['deactivated', 'teamId'],
					hint: Indexes.byNormalizedUrl
				},
				noCache: true
			}
		);
	}

	// get the teams that own the repos we found
	getTeams (callback) {
		this.teamIds = this.repos.map(repo => repo.teamId);
		if (this.teamIds.length === 0) {
			this.teams = [];
			return callback();
		}
		this.data.teams.getByIds(
			this.teamIds,
			(error, teams) => {
				if (error) { return callback(error); }
				this.teams = teams.filter(team => !team.get('deactivated'));
				callback();
			}
		);
	}

	// get the set of unique usernames represented by the users who are on the team(s)
	getUsernames (callback) {
		if (this.teamIds.length === 0) {
			// did not find any teams
			return callback();
		}
		const query = {
			teamIds: this.data.teams.inQuerySafe(this.teamIds)
		};
		// query for all users in the teams, but only send back the usernames
		// for users who have a username, and users who aren't deactivated
		this.data.users.getByQuery(
			query,
			(error, users) => {
				if (error) { return callback(error); }
				this.users = users.filter(user => !user.deactivated && user.username);
				callback();
			},
			{
				databaseOptions: {
					fields: ['username', 'teamIds', 'firstName', 'lastName'],
					hint: UserIndexes.byTeamIds
				},
				noCache: true
			}
		);
	}

	// classify the usernames according to team
	classifyUsernames (callback) {
		BoundAsync.forEachLimit(
			this,
			this.users,
			50,
			this.classifyUsername,
			callback
		);
	}

	// classify a single username according to the team
	classifyUsername (user, callback) {
		this.usernames = {};
		(user.teamIds || []).forEach(teamId => {
			this.usernames[teamId] = this.usernames[teamId] || [];
			this.usernames[teamId].push(user.username);
		});
		callback();
	}

	// get the creators of each team we found, for first and last name
	getTeamCreators (callback) {
		this.creatorsByTeamId = {};
		this.teams.forEach(team => {
			const creatorId = team.get('creatorId');
			const user = this.users.find(user => user._id === creatorId);
			if (user && (user.firstName || user.lastName)) {
				this.creatorsByTeamId[team.id] = {
					firstName: user.firstName,
					lastName: user.lastName
				};
			}
		});
		process.nextTick(callback);
	}

	// fetch the creators of each team we found, for first and last name
	fetchTeamCreators (callback) {
		const teamCreatorIds = this.teams.map(team => team.get('creatorId'));
		this.data.users.getByIds(
			teamCreatorIds,
			(error, users) => {
				if (error) { return callback(error); }
				this.teamCreators = users;
				callback();
			}
		);
	}

	// classify the team creators by team ID
	classifyTeamCreators (callback) {
		this.creatorsByTeamId = {};
		this.teams.forEach(team => {
			const user = this.teamCreators.find(creator => creator.id === team.get('creatorId'));
			if (user) {
				this.creatorsByTeamId[team.id] = {
					firstName: user.get('firstName'),
					lastName: user.get('lastName')
				};
			}
		});
		process.nextTick(callback);
	}

	// form the response to the request
	formResponse (callback) {
		// we return only the team names and IDs
		const teams = (this.teams || []).map(team => {
			return {
				_id: team.id,
				name: team.get('name')
			};
		});
		this.responseData = {
			teams: teams,
			//			usernames: this.usernames || {},
			teamCreators: this.creatorsByTeamId || {}
		};
		process.nextTick(callback);
	}
}

module.exports = MatchRepoRequest;
