// handle the 'GET /no-auth/match-repo' request, to find one or more matches for a repo
// among already-known teams ... we'll look at the url and try to find similar urls
// already owned by other teams

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const NormalizeURL = require('./normalize_url');
const Indexes = require('./indexes');
const UserIndexes = require(process.env.CS_API_TOP + '/modules/users/indexes');
const Errors = require('./errors');
const KnownGitServices = require('./known_git_services');

class MatchRepoRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(Errors);
	}

	authorize (callback) {
		return callback(false);	// no ACL check needed, authorization is by whether you have the correct first commit hash for the repo
	}

	process (callback) {
		BoundAsync.series(this, [
			this.require,			// handle required request parameters
			this.parseUrl,			// parse the input url for relevant details
			this.findRepo,			// attempt to find the repo
			this.getUsernames,		// get usernames for the teams matching a repo, if a matching repo is found
			this.getTeams,			// get the teams owning the repo(s) we found
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
					string: ['url', 'firstCommitHash']
				}
			},
			callback
		);
	}

	// parse the incoming url for relevant details
	parseUrl (callback) {
		this.request.query.firstCommitHash = this.request.query.firstCommitHash.toLowerCase();
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
		return Object.keys(KnownGitServices).find(service => {
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
				this.repos = repos.filter(repo => !repo.get('deactivated'));
				// do we have an exact match? if so, we can act like find-repo
				// was called
				this.matchingRepo = this.repos.find(repo => {
					return repo.get('normalizedUrl') === this.normalizedUrl;
				});
				if (
					this.matchingRepo &&
					!this.matchingRepo.isKnownCommitHash(this.request.query.firstCommitHash)
				) {
					// oops, you have to have one of the known commit hashes
					return callback(this.errorHandler.error('shaMismatch'));
				}
				process.nextTick(callback);
			},
			{
				databaseOptions: {
					hint: Indexes.byNormalizedUrl
				}
			}
		);
	}

	// in the case of an exact match for a repo, get the set of unique usernames
	// represented by the users who are on the team that owns the repo
	getUsernames (callback) {
		if (!this.matchingRepo) {
			// did not find a matching repo
			return callback();
		}
		const teamId = this.matchingRepo.get('teamId');
		const query = {
			teamIds: teamId
		};
		// query for all users in the team that owns the repo, but only send back the usernames
		// for users who have a username, and users who aren't deactivated
		this.data.users.getByQuery(
			query,
			(error, users) => {
				if (error) { return callback(error); }
				this.usernames = [];
				users.forEach(user => {
					if (!user.deactivated && user.username) {
						this.usernames.push(user.username);
					}
				});
				process.nextTick(callback);
			},
			{
				databaseOptions: {
					fields: ['username'],
					hint: UserIndexes.byTeamIds
				},
				noCache: true
			}
		);
	}

	// get the teams that own the repos we found
	getTeams (callback) {
		if (this.matchingRepo) {
			// no need for this if we found an exact match for the repo
			return callback();
		}
		this.teamIds = this.repos.map(repo => repo.get('teamId'));
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

	// fetch the creators of each team we found, for first and last name
	fetchTeamCreators (callback) {
		if (this.matchingRepo) {
			// no need for this if we found an exact match for the repo
			return callback();
		}
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
		if (this.matchingRepo) {
			// no need for this if we found an exact match for the repo
			return callback();
		}
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
		if (this.matchingRepo) {
			// if we found an exact match, return that and the associated usernames,
			// like find-repo
			this.responseData = {
				repo: this.matchingRepo.getSanitizedObject(),
				usernames: this.usernames
			};
			return process.nextTick(callback);
		}
		// we return only the team names and IDs
		const teams = (this.teams || []).map(team => {
			return {
				_id: team.id,
				name: team.get('name')
			};
		});
		this.responseData = {
			teams: teams,
			teamCreators: this.creatorsByTeamId || {}
		};
		if (this.service) {
			this.responseData.knownService = KnownGitServices[this.service];
			this.responseData.org = this.org;
		}
		else {
			this.responseData.domain = this.domain;
		}
		process.nextTick(callback);
	}
}

module.exports = MatchRepoRequest;
