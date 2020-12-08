// handle the PUT /repos/team-lookup request,
// to find the team owning a repo, according to commit hashes

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request');
const RepoByCommitHashIndexes = require('./repo_by_commit_hash_indexes');

class TeamLookupRequest extends RestfulRequest {

	// authorize the request for the current user
	async authorize() {
		// no authorization necessary
		return true;
	}

	// process the request...
	async process() {
		await this.requireAndAllow();	// require certain parameters, discard unknown parameters
		if (!await this.lookupRepo()) { // lookup the repo according to commit hash
			return;
		}		
		await this.getTeam();			// get the team that owns this repo
		await this.getAdmins();			// get the admin users for this team
	}

	// require certain parameters, discard unknown parameters
	async requireAndAllow() {
		await this.requireAllowParameters(
			'query',
			{
				required: {
					'string': ['commitHashes']
				}
			}
		);
	}

	// lookup the repo according to the commit hash
	async lookupRepo () {
		// look for repos represented by the passed commit hashes, hopefully only one matches
		let commitHashes = decodeURIComponent(this.request.query.commitHashes.toLowerCase()).split(',');
		commitHashes = commitHashes.filter(hash => hash);
		if (commitHashes.length === 0) {
			throw this.errorHandler.error('parameterRequired', { info: 'commitHashes' });
		}
		const repos = await this.data.reposByCommitHash.getByQuery(
			{ 
				commitHash: { $in: commitHashes }
			},
			{
				hint: RepoByCommitHashIndexes.byCommitHash
			}
		);
		if (repos.length === 0) {
			return false;
		} else if (repos.length > 1) {
			this.warn(`Found more than one repo matching commit hashes, only first will be returned: ${commitHashes}`);
		}
		this.repo = await this.data.repos.getById(repos[0].get('repoId'));
		if (!this.repo || this.repo.get('deactivated')) {
			throw this.errorHandler.error('notFound', { info: 'repoId' }); // shouldn't happen
		}
		return true;
	}

	// get the team that owns the repo found
	async getTeam () {
		this.team = await this.data.teams.getById(this.repo.get('teamId'));
		if (!this.team || this.team.get('deactivated')) {
			throw this.errorHandler.error('notFound', { info: 'team' }); // shouldn't happen
		}

		// check if the team has the auto-join setting on, if not, this feature is not permitted
		const settings = this.team.get('settings') || {};
		if (!settings.autoJoinEnabled) {
			throw this.errorHandler.error('readAuth', { reason: 'Auto-join is not enabled for this team' });
		}
	}

	// get the admin users on this team
	async getAdmins () {
		const adminIds = this.team.get('adminIds') || [];
		if (adminIds.length === 0) {
			this.admins = []; // tough luck, i guess
			return;
		}
		this.admins = await this.data.users.getByIds(this.team.get('adminIds') || []);
	}

	// handle returning the response
	async handleResponse() {
		if (this.gotError) {
			return await super.handleResponse();
		}
		if (this.repo) {
			this.responseData = {
				repo: this.repo.getSanitizedObject({ request: this }),
				team: this.team.getSanitizedObject({ request: this }),
				admins: this.admins.map(user => user.getSanitizedObject({ request: this }))
			};
		}
		return super.handleResponse();
	}

	// describe this route for help
	static describe() {
		return {
			tag: 'team-lookup',
			summary: 'Lookup team and repo info associated with the repo associated with the given commit hashes',
			access: 'No access rules, but team that owns the matching repo must have auto-join feature turned on',
			description: 'Will search the entire list of known repos for one that matches one or more of the given commit hashes; if found, will return info associated with that repo, including the repo, the team that owns it, and admin users on that team',
			input: {
				summary: 'Specify an array of commit hashes as comma-separated values in the query',
				looksLike: {
					commitHashes: '<Array of comma-separated commit SHAs>'
				}
			},
			returns: {
				summary: 'The repo that matched, the team that owns the repo, and the admin users on the team',
				looksLike: {
					repo: '<matching repo>',
					team: '<owning team>',
					admins: '<array of admins>'
				}
			},
			errors: [
				'readAuth',
				'parameterRequired'
			]
		};
	}
}

module.exports = TeamLookupRequest;
