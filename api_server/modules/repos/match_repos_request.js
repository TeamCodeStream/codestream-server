// handle the PUT /repos/match/:teamId request,
// to match repo remotes and commit hashes to known repos

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request');
const RepoMatcher = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/repos/repo_matcher');

class MatchReposRequest extends RestfulRequest {

	// authorize the request for the current user
	async authorize () {
		this.teamId = this.request.params.teamId.toLowerCase();
		if (!await this.user.authorizeTeam(this.teamId)) {
			throw this.errorHandler.error('updateAuth', { reason: 'user must be a member of the team' });
		}
	}

	// process the request...
	async process () {
		await this.requireAndAllow();		// require certain parameters, discard unknown parameters
		const team = await this.data.teams.getById(this.teamId);
		if (!team) {
			throw this.errorHandler.error('notFound', { info: this.team }); // shouldn't happen
		}

		const repoMatcher = new RepoMatcher({
			request: this,
			team
		});
		this.repoIds = [];
		for (let repo of this.request.body.repos) {
			const matchedRepo = await repoMatcher.findOrCreateRepo({
				remotes: repo.remotes || [],
				knownCommitHashes: repo.knownCommitHashes || []
			});
			if (matchedRepo) {
				this.repoIds.push(matchedRepo.id);
			}
		}
	}

	// require certain parameters, discard unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters(
			'body',
			{
				required: {
					'array(object)': ['repos']
				}
			}
		);
	}

	// handle returning the response
	async handleResponse () {
		if (this.gotError) {
			return await super.handleResponse();
		}
		
		let repos = [];
		if (this.repoIds.length > 0) {
			repos = await this.data.repos.getByIds(
				this.repoIds,
				{
					ignoreCache: true,
					noCache: true,
					sortInOrder: true
				}
			);
		}
		this.responseData = { repos: repos.map(repo => repo.getSanitizedObject()) };
		return await super.handleResponse();
	}

	// after returning the response...
	async postProcess () {
		// publish any created repos or repo updates to the team channel
		const { transforms } = this;
		const createdRepos = (transforms.createdRepos || []).map(repo => repo.getSanitizedObject({ request: this }));
		const message = {
			repos: [
				...createdRepos,
				...(transforms.repoUpdates || [])
			],
			requestId: this.request.id
		};
		if (message.repos.length === 0) {
			return; // nothing to publish
		}

		const channel = 'team-' + this.teamId;
		try {
			await this.api.services.broadcaster.publish(
				message,
				channel,
				{ request: this.request	}
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.warn(`Could not publish matched repo message to team ${this.teamId}: ${JSON.stringify(error)}`);
		}
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'match-repos',
			summary: 'Match repos, given by remotes and/or known commit hashes, to any known repos for a team',
			access: 'User must be a member of the team',
			description: 'Should be called by clients on initialization to get known repos that match any of the repos the user has open in their ID. Repos can be matched by remotes or known commit hashes. If no match for given characteristics is found, a repo will be created.',
			input: {
				summary: 'Specify the team ID in the path, and an array of hashes containing "remotes" and "knownCommitHashes" in the body',
				looksLike: {
					repos: '<Array of hashes like: { remotes, knownCommitHashes }, where remotes is an array of URLs and knownCommitHashes is an array of commit SHAs>'
				}
			},
			returns: {
				summary: 'The repos that matched, and/or the repos created, in the same order as the array provided',
				looksLike: {
					repos: '<array of repos>'
				}
			},
			publishes: 'Any repos created will be published to the team channel, and for any repos for which new remotes or known commit hashes were discovered, directives for updating those repos will be published to the team channel',
			errors: [
				'updateAuth'
			]
		};
	}
}

module.exports = MatchReposRequest;
