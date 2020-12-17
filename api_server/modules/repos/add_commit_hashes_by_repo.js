'use strict';

const ArrayUtilities = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/array_utilities');
const RepoByCommitHashIndexes = require('./repo_by_commit_hash_indexes');

// for the given repo, make sure we have a record mapping all its known commit hashes to the repo
const AddCommitHashesByRepo = async function (repo, data) {
	// get the known commit hashes, ensuring uniqueness
	let commitHashes = repo.get('knownCommitHashes') || [];
	if (repo.get('firstCommitHash')) {
		commitHashes.push(repo.get('firstCommitHash'));
	}
	commitHashes = ArrayUtilities.unique(commitHashes);
console.warn('commitHashes for repo are', commitHashes);

	// look for existing records, we don't want to create duplicates
	// (for instance, if the repo was added then removed from auto-join, then it will already have records)
	let records = await data.reposByCommitHash.getByQuery(
		{ commitHash: { $in: commitHashes } },
		{ hint: RepoByCommitHashIndexes.byCommitHash }
	);
console.warn('existing records:', records);

	// reduce to the records relevant to this repo
	records = records.filter(record => record.get('repoId') === repo.id); 
console.warn('records owned by repo', records);

	// reduce to the commit hashes we don't have mappings for, for this repo
	const needCommitHashes = commitHashes.filter(commitHash => {
		return !records.find(record => record.get('commitHash') === commitHash);
	});
console.warn('need commit hashes:', needCommitHashes);

	if (needCommitHashes.length > 0) {
		// create the mappings
		const recordsToAdd = needCommitHashes.map(commitHash => {
			return {
				repoId: repo.id,
				commitHash
			};
		});
console.warn('ADDING:', records)
		await data.reposByCommitHash.createMany(recordsToAdd, { noVersion: true });
	}
};

module.exports = AddCommitHashesByRepo;

