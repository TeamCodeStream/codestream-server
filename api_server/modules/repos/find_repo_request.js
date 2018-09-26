// handle the 'GET /no-auth/find-repo' request, to find if a repo is already known to the system, and if
// so, what team owns it and what are the usernames of the users on the team ... authorization is by
// having the correct hash for the first commit of the repo

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
const NormalizeURL = require('./normalize_url');
const Indexes = require('./indexes');
const UserIndexes = require(process.env.CS_API_TOP + '/modules/users/indexes');
const Errors = require('./errors');

class FindRepoRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(Errors);
	}

	async authorize () {
		// no ACL check needed, authorization is by whether you have the correct first commit hash for the repo
	}

	async process () {
		await this.require();		// handle required request parameters
		await this.normalize();		// normalize the request parameters
		await this.findRepo();		// attempt to find the repo
		await this.getUsernames();	// get the unique usernames for the team that owns the repo
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

	// normalize the request parameters
	async normalize () {
		// normalize the incoming URL and enforce lowercase on the first commit hash
		this.normalizedUrl = NormalizeURL(decodeURIComponent(this.request.query.url));

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

	// attempt to find the repo by (normalized) URL
	async findRepo () {
		const query = {
			normalizedUrl: this.normalizedUrl
		};
		const repos = await this.data.repos.getByQuery(
			query,
			{ hint: Indexes.byNormalizedUrl }
		);
		this.repo = repos.find(repo => !repo.get('deactivated'));
		if (!this.repo) {
			return;	// no matching (active) repos, we'll just send an empty response
		}
		if (!this.repo.haveKnownCommitHash(this.knownCommitHashes)) {
			// oops, you have to have one of the known commit hashes
			throw this.errorHandler.error('shaMismatch');
		}
		this.responseData.repo = this.repo.getSanitizedObject();
	}

	// get the set of unique usernames represented by the users who are on the team that owns the repo
	async getUsernames () {
		if (!this.repo) {
			// did not find a matching repo
			return;
		}
		const teamId = this.repo.get('teamId');
		const query = {
			teamIds: teamId
		};
		// query for all users in the team that owns the repo, but only send back the usernames
		// for users who have a username, and users who aren't deactivated
		const users = await this.data.users.getByQuery(
			query,
			{
				fields: ['username'],
				hint: UserIndexes.byTeamIds,
				noCache: true
			}
		);
		this.responseData.usernames = [];
		users.forEach(user => {
			if (!user.deactivated && user.username) {
				this.responseData.usernames.push(user.username);
			}
		});
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'find-repo',
			summary: 'Finds a matching repo according to URL',
			access: 'No authorization is required, though the knownCommitHashes provided must contain a match to any known commit hashes for the repo if it is found',
			description: 'Given a URL, will try to find a matching repo by normalizing the URL and comparing with the normalized URLs of other known repos. If a repo is found, also returns the usernames of all users in the team that owns the repo.',
			input: {
				summary: 'Specify parameters in the query',
				looksLike: {
					'url*': '<URL of the repo to find>',
					'knownCommitHashes*': '<Comma-separated array of commit SHAs representing the earliest commits in the repo, to verify the user has true access to the repo>'
				}
			},
			returns: {
				summary: 'Returns a matching repo object, if found, or an empty object if not found',
				looksLike: {
					repo: '<@@#repo object#repo@@>',
					usernames: '<Array of usernames, representing all the users on the team that owns the repo>'
				}
			},
			errors: [
				'parameterRequired',
				'shaMismatch'
			]
		};
	}
}

module.exports = FindRepoRequest;
