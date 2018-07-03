// handle the 'GET /no-auth/match-repo' request, to find one or more matches for a repo
// among already-known teams ... we'll look at the url and try to find similar urls
// already owned by other teams

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
const NormalizeURL = require('./normalize_url');
const ExtractCompanyIdentifier = require('./extract_company_identifier');
const Indexes = require('./indexes');
const UserIndexes = require(process.env.CS_API_TOP + '/modules/users/indexes');
const Errors = require('./errors');

class MatchRepoRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(Errors);
	}

	async authorize () {
		// no ACL check needed, authorization is by whether you have the correct first commit hash for the repo
	}

	async process () {
		await this.require();			// handle required request parameters
		await this.parseUrl();			// parse the input url for relevant details
		await this.findRepo();			// attempt to find the repo
		await this.getUsernames();		// get usernames for the teams matching a repo, if a matching repo is found
		await this.getTeams();			// get the teams owning the repo(s) we found
		await this.fetchTeamCreators();	// fetch the creators of the teams
		await this.classifyTeamCreators();	// classify team creators by team ID
		await this.formResponse();		// form the request response
	}

	// these parameters are required for the request
	async require () {
		await this.requireAllowParameters(
			'query',
			{
				required: {
					string: ['url']
				},
				optional: {
					'string': ['firstCommitHash', 'knownCommitHashes']
				}
			}
		);
	}

	// parse the incoming url for relevant details
	async parseUrl () {
		this.normalizedUrl = NormalizeURL(decodeURIComponent(this.request.query.url));
		this.companyIdentifier = ExtractCompanyIdentifier.extractCompanyIdentifier(this.normalizedUrl);

		// establish array of known commit hashes for the repo, this can be either through
		// 'firstCommitHash' (old way), or 'knownCommitHashes' (new way)
		this.knownCommitHashes = [];
		if (this.request.query.knownCommitHashes) {
			this.knownCommitHashes = this.request.query.knownCommitHashes.split(',');
		}
		if (this.request.query.firstCommitHash) {
			this.knownCommitHashes.push(this.request.query.firstCommitHash);
		}
		this.knownCommitHashes = this.knownCommitHashes.map(hash => hash.toLowerCase());
		if (this.knownCommitHashes.length === 0) {
			throw this.errorHandler.error('parameterRequired', { info: 'firstCommitHash or knownCommitHashes' });
		}
	}

	// attempt to find any matching repos
	async findRepo () {
		if (!this.companyIdentifier) {
			// we already know there will be no matches
			this.repos = [];
			return;
		}

		const companyIdentifierString = ExtractCompanyIdentifier.formCompanyIdentifier(this.companyIdentifier);
		const query = {
			companyIdentifier: companyIdentifierString
		};
		const repos = await this.data.repos.getByQuery(
			query,
			{
				databaseOptions: {
					hint: Indexes.byCompanyIdentifier
				}
			}
		);
		this.repos = repos.filter(repo => !repo.get('deactivated'));
		// do we have an exact match? if so, we can act like find-repo
		// was called
		this.matchingRepo = this.repos.find(repo => {
			return repo.get('normalizedUrl') === this.normalizedUrl;
		});
		if (
			this.matchingRepo &&
			!this.matchingRepo.haveKnownCommitHash(this.knownCommitHashes)
		) {
			// oops, you have to have one of the known commit hashes
			throw this.errorHandler.error('shaMismatch');
		}
	}

	// in the case of an exact match for a repo, get the set of unique usernames
	// represented by the users who are on the team that owns the repo
	async getUsernames () {
		if (!this.matchingRepo) {
			// did not find a matching repo
			return;
		}
		const teamId = this.matchingRepo.get('teamId');
		const query = {
			teamIds: teamId
		};
		// query for all users in the team that owns the repo, but only send back the usernames
		// for users who have a username, and users who aren't deactivated
		const users = await this.data.users.getByQuery(
			query,
			{
				databaseOptions: {
					fields: ['username'],
					hint: UserIndexes.byTeamIds
				},
				noCache: true
			}
		);
		this.usernames = [];
		users.forEach(user => {
			if (!user.deactivated && user.username) {
				this.usernames.push(user.username);
			}
		});
	}

	// get the teams that own the repos we found
	async getTeams () {
		if (this.matchingRepo) {
			// no need for this if we found an exact match for the repo
			return;
		}
		this.teamIds = this.repos.map(repo => repo.get('teamId'));
		if (this.teamIds.length === 0) {
			this.teams = [];
			return;
		}
		const teams = await this.data.teams.getByIds(this.teamIds);
		this.teams = teams.filter(team => !team.get('deactivated'));
	}

	// fetch the creators of each team we found, for first and last name
	async fetchTeamCreators () {
		if (this.matchingRepo) {
			// no need for this if we found an exact match for the repo
			return;
		}
		const teamCreatorIds = this.teams.map(team => team.get('creatorId'));
		this.teamCreators = await this.data.users.getByIds(teamCreatorIds);
	}

	// classify the team creators by team ID
	async classifyTeamCreators () {
		if (this.matchingRepo) {
			// no need for this if we found an exact match for the repo
			return;
		}
		this.creatorsByTeamId = {};
		this.teams.forEach(team => {
			const user = this.teamCreators.find(creator => creator.id === team.get('creatorId'));
			if (user) {
				this.creatorsByTeamId[team.id] = {
					fullName: user.get('fullName')
				};
			}
		});
	}

	// form the response to the request
	async formResponse () {
		if (this.matchingRepo) {
			// if we found an exact match, return that and the associated usernames,
			// like find-repo
			this.responseData = {
				repo: this.matchingRepo.getSanitizedObject(),
				usernames: this.usernames
			};
			return;
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
		if (this.companyIdentifier && this.companyIdentifier.service) {
			this.responseData.knownService =
				ExtractCompanyIdentifier.KNOWN_GIT_SERVICES[this.companyIdentifier.service];
			this.responseData.org = this.companyIdentifier.org;
		}
		else if (this.companyIdentifier.domain) {
			this.responseData.domain = this.companyIdentifier.domain;
		}
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'match-repo',
			summary: 'Finds a probable team that may own a given repo',
			access: 'No authorization is required, though the knownCommitHashes provided must contain a match to any known commit hashes for the repo if an exact match is found',
			description: 'Given a URL, will try to find a match based on domain or org name (for github or bitbucket) within known repos; if an exact match is found, returns the matching repo; if a team is found that owns similar repos, return the team names and the creators of those teams.',
			input: {
				summary: 'Specify parameters in the query',
				looksLike: {
					'url*': '<URL of the repo to match>',
					'knownCommitHashes*': '<Comma-separated array of commit SHAs representing the earliest commits in the repo, to verify the user has true access to the repo if an exact match is found>'
				}
			},
			returns: {
				summary: 'If an exact match is found to the repo, returns the repo along with the usernames of all users on the team that owns the repo (like @@#/no-auth/find-repo#find-repo@@); otherwise if one or more probable owning teams are found, returns the team names and the names of their creators.',
				looksLike: {
					repo: '<@@#repo object#repo@@ > (if an exact match was found)',
					usernames: '<If an exact match was found, array of usernames, representing all the users on the team that owns the repo>',
					teams: '<If matching owning teams are found, array of team names>',
					teamCreators: '<If matching owning teams are found, object of team creators, keys are team IDs>',
					knownService: '<If matching owning teams are found, contains the service provider associated with the URL (github, bitbucket)>',
					org: '<If matching owning teams are found, contains the org name as parsed from the URL>',
					domain: '<If matching owning teams are found, contains the domain name as parsed from the URL, if no service provider was parsed>'
				}
			},
			errors: [
				'parameterRequired',
				'shaMismatch'
			]
		};
	}
}

module.exports = MatchRepoRequest;
