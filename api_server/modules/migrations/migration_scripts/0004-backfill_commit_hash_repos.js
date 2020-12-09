'use strict';

const Migration = require('./migration');
const ArrayUtilities = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/array_utilities');

const ThrottleTime = 100;

// wait this number of milliseconds
const Wait = function (time) {
	return new Promise(resolve => {
		setTimeout(resolve, time);
	});
};

class BackfillCommitHashRepos extends Migration {

	get description () {
		return 'Backfilling commit hash to repo mappings for all repos';
	}

	async execute () {
		const result = await this.data.repos.getByQuery(
			{ 
				commitHashMapComplete: { $ne: true }
			},
			{
				stream: true,
				overrideHintRequired: true,
				sort: { _id: -1 }
			}
		);

		let repo;
		do {
			repo = await result.next();
			if (repo) {
				await this.processRepo(repo);
				await Wait(ThrottleTime);
			}
		} while (repo);
		result.done();

	}

	async processRepo (repo) {
		let commitHashes = repo.knownCommitHashes || [];
		if (repo.firstCommitHash && !commitHashes.includes(repo.firstCommitHash)) {
			commitHashes.push(repo.firstCommitHash);
		}
		commitHashes = ArrayUtilities.unique(commitHashes);

		this.log(`Writing ${commitHashes.length} commit hash entries for repo ${repo.id}...`);
		const records = commitHashes.map(commitHash => {
			return {
				commitHash,
				repoId: repo.id
			}
		});
		await this.data.reposByCommitHash.createMany(records, { noVersion: true });
		await this.data.repos.updateDirect(
			{ id: this.data.repos.objectIdSafe(repo.id) },
			{$set: { commitHashMapComplete: true } }
		);
	}

	async verify () {
		const repos = await this.data.repos.getByQuery(
			{ commitHashMapComplete: { $ne: true } },
			{ overrideHintRequired: true }
		);
		if (repos.length > 0) {
			throw 'one or more repos dont have the commitHashMapComplete flag set';
		}
	}
}

module.exports = BackfillCommitHashRepos;