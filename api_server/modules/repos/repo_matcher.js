// find a match for a repo among known team repos given a set of remotes and known commit hashes

'use strict';

const RepoIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/repos/indexes');
const ArrayUtilities = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/array_utilities');
const ExtractCompanyIdentifier = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/repos/extract_company_identifier');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');
const RepoCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/repos/repo_creator');
const NormalizeURL = require('./normalize_url');
const AddCommitHashesByRepo = require('./add_commit_hashes_by_repo');

class RepoMatcher {

	constructor (options) {
		Object.assign(this, options);
		if (!this.team) {
			throw 'must provide team when matching repos';
		}
		['transforms', 'data', 'errorHandler'].forEach(prop => {
			this[prop] = this.request[prop];
		});
	}

	async findOrCreateRepo (repoInfo) {
		if (!this.team) {
			throw 'must provide team when matching repos';
		}
		if (!this.teamRepos) {
			await this.getTeamRepos();
		}

		if (repoInfo.remotes && !(repoInfo.remotes instanceof Array)) {
			throw this.errorHandler.error('invalidParameter', { info: 'remotes must be an array' });
		}
		if (repoInfo.knownCommitHashes && !(repoInfo.knownCommitHashes instanceof Array)) {
			throw this.errorHandler.error('invalidParameter', { info: 'knownCommitHashes must be an array' });
		}

		const remotes = (repoInfo.remotes || [])
			.filter(remote => typeof remote === 'string')
			.map(remote => NormalizeURL(remote));
		const knownCommitHashes = (repoInfo.knownCommitHashes || [])
			.filter(commitHash => typeof commitHash === 'string')
			.map(commitHash => commitHash.toLowerCase());
		const matchingRepos = this.teamRepos.filter(repo => {
			return (
				(remotes && repo.matchesRemotes(remotes)) ||
				(knownCommitHashes && repo.haveKnownCommitHashes(knownCommitHashes))
			);
		});

		let repo;
		const passedRemotes = JSON.stringify(remotes);
		const passedHashes = JSON.stringify(knownCommitHashes);
		if (matchingRepos.length === 0) {
			if (remotes.length > 0) {
				this.request.log(`No match found for remotes:\n${passedRemotes}\nor known commit hashes:\n${passedHashes}\nwill create repo instead...`);
				repo = await this.createRepo({ remotes, knownCommitHashes });
			}
		}
		else {
			repo = matchingRepos[0];
			const matchedRemotes = JSON.stringify((repo.get('remotes') || []).map(r => r.normalizedUrl));
			const matchedHashes = JSON.stringify((repo.get('knownCommitHashes') || []));
			if (matchingRepos.length === 1) {
				this.request.log(`Match found for repo on remotes:\n${matchedRemotes}\nor on commit hashes:\n${matchedHashes}\n, from passed remotes:\n${passedRemotes}\nor passed commit hashes:\n${passedHashes}`);
				await this.updateRepoWithNewInfo(repo, remotes, knownCommitHashes);
			}
		}
		return repo;
	}

	// get all the repos known to this team
	async getTeamRepos () {
		this.teamRepos = await this.data.repos.getByQuery(
			{ 
				teamId: this.team.id
			},
			{ 
				hint: RepoIndexes.byTeamId 
			}
		);
	}

	// create a new repo with the given remotes
	async createRepo (repoInfo) {
		const repoData = Object.assign({}, repoInfo, { teamId: this.team.id });
		const newRepo = await new RepoCreator({
			request: this.request
		}).createRepo(repoData);
		this.transforms.createdRepos = this.transforms.createdRepos || [];
		this.transforms.createdRepos.push(newRepo);
		this.teamRepos.push(newRepo);
		return newRepo;
	}

	// if we found a matching repo for the remotes or commit hashes passed in, check to see if all
	// the remotes passed in are known for this repo; if not, update the repo with
	// any unknown remotes
	async updateRepoWithNewInfo (repo, remotes, knownCommitHashes) {
		const updateRepoInfo = this.getUpdateRepoInfo(repo, remotes, knownCommitHashes);
		const { newRemotes, newCommitHashes, existingRepoUpdateOp } = updateRepoInfo;
		if (newRemotes.length === 0 && newCommitHashes.length === 0) {
			return;
		}

		// now we have a definitive list of remotes and/or commit hashes to add to the repo
		const remotesToPush = newRemotes.map(remote => {
			return {
				url: remote,
				normalizedUrl: remote,
				companyIdentifier: ExtractCompanyIdentifier.getCompanyIdentifier(remote)
			};
		});
		const op = existingRepoUpdateOp || {
			$set: {
				modifiedAt: Date.now()
			}
		};
		if (remotesToPush.length > 0) {
			op.$push = op.$push || {};
			op.$push.remotes = op.$push.remotes || [];
			op.$push.remotes = [...op.$push.remotes, ...remotesToPush];
		}

		let addCommitHashes = [];
		if (newCommitHashes.length > 0) {
			addCommitHashes = ArrayUtilities.difference(
				newCommitHashes,
				((op.$addToSet || {}).knownCommitHashes || [])
			);
			if (addCommitHashes.length > 0) {
				op.$addToSet = op.$addToSet || {};
				op.$addToSet.knownCommitHashes = op.$addToSet.knownCommitHashes || [];
				op.$addToSet.knownCommitHashes = [...op.$addToSet.knownCommitHashes, ...addCommitHashes];
			}
		}

		if (!existingRepoUpdateOp) {
			const repoUpdateOp = await new ModelSaver({
				request: this.request,
				collection: this.data.repos,
				id: repo.id
			}).save(op);
			this.transforms.repoUpdates = this.transforms.repoUpdates || [];
			this.transforms.repoUpdates.push(repoUpdateOp);
		}

		// if this repo is on the "auto-join" list for the team, save new known commit hashes 
		if (addCommitHashes.length > 0) {
			const settings = this.team.get('settings') || {};
			const autoJoinRepos = settings.autoJoinRepos || [];
			if (autoJoinRepos.includes(repo.id)) {
				await AddCommitHashesByRepo(repo, this.data);
			}
		}
	}

	// get info relevant to updating an existing repo with new remotes or commit hashes
	getUpdateRepoInfo (repo, remotes, knownCommitHashes) {
		// compare the existing repo's remotes and known commit hashes with those already discovered
		const repoRemotes = repo.getRemotes() || [];
		const alreadyKnownCommitHashes = repo.get('knownCommitHashes') || [];
		const existingRepoUpdateOp = (this.transforms.repoUpdates || []).find(repoUpdate => repoUpdate.id === repo.id);
		let newRemotes = ArrayUtilities.difference(remotes || [], repoRemotes);
		let newCommitHashes = ArrayUtilities.difference(knownCommitHashes || [], alreadyKnownCommitHashes);

		// see if we've already seen these same remotes and commit hashes
		if (existingRepoUpdateOp) {
			if (existingRepoUpdateOp.$push && existingRepoUpdateOp.$push.remotes) {
				const remotesAlreadyBeingUpdated = existingRepoUpdateOp.$push.remotes.map(r => r.normalizedUrl);
				newRemotes = ArrayUtilities.difference(newRemotes, remotesAlreadyBeingUpdated);
			}
			if (existingRepoUpdateOp.$addToSet && existingRepoUpdateOp.$addToSet.knownCommitHashes) {
				newCommitHashes = ArrayUtilities.difference(newCommitHashes, existingRepoUpdateOp.$addToSet.knownCommitHashes);
			}
		}
		return { newRemotes, newCommitHashes, existingRepoUpdateOp };
	}
}

module.exports = RepoMatcher;
