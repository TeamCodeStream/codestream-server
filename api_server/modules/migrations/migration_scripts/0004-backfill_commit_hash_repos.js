'use strict';

const Migration = require('./migration');

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
		const commitHashes = repo.knownCommitHashes || [];
		if (repo.firstCommitHash && !commitHashes.includes(repofirstCommitHash)) {
			commitHashes.push(repo.firstCommitHash);
		}

		this.log(`Writing ${commitHashes.length} commit hash entries for repo ${repo.id}...`);
		await Promise.all(commitHashes.map(async commitHash => {
			const op = {
				$set: {
					repoId: repo.id,
				}
			};
			await this.data.reposByCommitHash.updateDirect(
				{ id: commitHash },
				op,
				{ upsert: true }
			);
		}));

		await this.data.repos.updateDirect(
			{ id: this.data.repos.objectIdSafe(repo.id) },
			{$set: { commitHashMapComplete: true } }
		);
	}

	async verify () {
	}
}

module.exports = BackfillCommitHashRepos;