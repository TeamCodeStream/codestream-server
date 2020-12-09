// handle the PUT /repos/team-lookup request,
// to find the team owning a repo, according to commit hashes

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request');
const RepoByCommitHashIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/repos/repo_by_commit_hash_indexes');
const ArrayUtilities = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/array_utilities');

class TeamLookupRequest extends RestfulRequest {

	// authorize the request for the current user
	async authorize() {
		// no authorization necessary
		return true;
	}

	// process the request...
	async process() {
		this.responseData = [];
		await this.requireAndAllow();	// require certain parameters, discard unknown parameters
		if (!await this.lookupRepos()) { // lookup the repo according to commit hash
			return;
		}		
		await this.getTeams();			// get the team that owns this repo
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
	async lookupRepos () {
		// look for repos represented by the passed commit hashes, hopefully only one matches
		let commitHashes = decodeURIComponent(this.request.query.commitHashes.toLowerCase()).split(',');
		commitHashes = commitHashes.filter(hash => hash);
		if (commitHashes.length === 0) {
			throw this.errorHandler.error('parameterRequired', { info: 'commitHashes' });
		}
		const records = await this.data.reposByCommitHash.getByQuery(
			{ commitHash: { $in: commitHashes } },
			{ hint: RepoByCommitHashIndexes.byCommitHash }
		);
		let repoIds = records.map(repo => repo.get('repoId'));
		repoIds = ArrayUtilities.unique(repoIds);
		if (repoIds.length === 0) {
			return false;
		} 

		this.repos = (await this.data.repos.getByIds(repoIds)).filter(repo => !repo.get('deactivated'));
		return true;
	}

	// get the teams that own the repos found
	async getTeams () {
		let teamIds = this.repos.map(repo => repo.get('teamId'));
		teamIds = ArrayUtilities.unique(teamIds);
		this.teams = await this.data.teams.getByIds(teamIds);

		// for each repo, check if the owning team has the auto-join setting on
		this.repos.forEach(repo => {
			const team = this.teams.find(team => team.id === repo.get('teamId'));
			if (!team) return;
			const settings = team.get('settings') || {};
			if ((settings.autoJoinRepos instanceof Array) && settings.autoJoinRepos.includes(repo.id)) {
				this.responseData.push({
					repo: repo.getSanitizedObject({ request: this }),
					team: team.getSanitizedObject({ request: this }),
					admins: []
				});
			}
		});
	}

	// get the admin users for all the teams
	async getAdmins () {
		let adminIds = [];
		this.responseData.forEach(entry => {
			adminIds = adminIds.concat(entry.team.adminIds || []);
		});
		if (adminIds.length === 0) {
			return; 
		}
		this.admins = await this.data.users.getByIds(adminIds);

		this.responseData.forEach(entry => {
			(entry.team.adminIds || []).forEach(adminId => {
				const admin = this.admins.find(admin => admin.id === adminId);
				if (admin) {
					entry.admins.push(admin.getSanitizedObject({ request: this }));
				}
			});
		});
	}

	// describe this route for help
	static describe() {
		return {
			tag: 'team-lookup',
			summary: 'Lookup team and repo info associated with the repo(s) associated with the given commit hashes',
			access: 'No access rules, but teams that own the matching repos must have auto-join feature turned on for the given repo',
			description: 'Will search the entire list of known repos for one that matches one or more of the given commit hashes; if found, will return an array of info associated with each matching repo, including the repo, the team that owns it, and admin users on that team',
			input: {
				summary: 'Specify an array of commit hashes as comma-separated values in the query',
				looksLike: {
					commitHashes: '<Array of comma-separated commit SHAs>'
				}
			},
			returns: {
				summary: 'An array of structures including the repo that matched, the team that owns the repo, and the admin users on the team',
				looksLike: {
					repo: '<matching repo>',
					team: '<owning team>',
					admins: '<array of admins>'
				}
			},
			errors: [
				'parameterRequired'
			]
		};
	}
}

module.exports = TeamLookupRequest;
