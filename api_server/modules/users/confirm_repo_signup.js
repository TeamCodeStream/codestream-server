'use strict';

// for signup by virtue of access to a repo, confirm this is allowed
const ConfirmRepoSignup = async options => {
	const { teamId, repoId, commitHash, request } = options;
	
	if (!teamId) return;

	// if a team ID is given, this is a repo-based signup, and we must also have a repoID and a known commit hash
	if (!repoId || typeof repoId !== 'string') {
		throw request.errorHandler.error('parameterRequired', { info: 'repoId' });
	}
	if (!commitHash || typeof commitHash !== 'string') {
		throw request.errorHandler.error('parameterRequired', { info: 'commitHash' });
	}

	// get the team
	const team = await request.data.teams.getById(teamId.toLowerCase());
	if (!team || team.get('deactivated')) {
		throw request.errorHandler.error('notFound', { info: 'team' });
	}

	// get the repo, and ensure it is owned by the team
	const repo = await request.data.repos.getById(repoId.toLowerCase());
	if (!repo || repo.get('deactivated')) {
		throw request.errorHandler.error('notFound', { info: 'repo' });
	}
	if (repo.get('teamId') !== team.id) {
		throw request.errorHandler.error('createAuth', { reason: 'given repo is not owned by the given team' });
	}

	// the team must have auto-signup for that repo enabled
	const settings = team.get('settings') || {};
	if (!(settings.autoJoinRepos || []).includes(repo.id)) {
		throw request.errorHandler.error('createAuth', { reason: 'auto-join is not turned on for this repo' });
	}

	// ensure the commit hash passed is a known commit hash for this repo
	if (!repo.haveKnownCommitHashes([commitHash.toLowerCase()])) {
		throw request.errorHandler.error('createAuth', { reason: 'commit hash is incorrect for this repo' });
	}

	return { team, repo };
};

module.exports = ConfirmRepoSignup;
