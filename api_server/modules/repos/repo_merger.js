'use strict';

const RepoIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/repos/indexes');
const ReviewIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/reviews/indexes');

class RepoMerger {

	constructor (options) {
		Object.assign(this, options);
	}

	async mergeFlaggedRepos (teamId) {
		const reposToMerge = await this.data.repos.getByQuery(
			{ teamId: teamId, shouldMergeToRepo: { $exists: true } } ,
			{ hint: RepoIndexes.byTeamId }
		);

		for (const repo of reposToMerge) {
			const toRepo = await this.data.repos.getById(repo.shouldMergeToRepo.toRepoId);
			if (!toRepo) {
				console.warn(`To-repo ${repo.shouldMergeToRepo.toRepoId} for from-repo ${repo.id} not found`);
			} else {
				await this.mergeRepos(repo, toRepo);
			}
		}
	}

	// merge one repo into another by updating all markers, all reviews, and all code errors with references
	async mergeRepos (fromRepo, toRepo) {
		await this.moveMarkersToRepo(fromRepo, toRepo);
		await this.moveReviewsToRepo(fromRepo, toRepo);
		await this.moveCodeErrorsToRepo(fromRepo, toRepo);
		await this.moveReposByCommitHash(fromRepo, toRepo);
		await this.moveFileStreams(fromRepo, toRepo);
		//await this.moveModifiedRepos(fromRepo, toRepo);
		await this.deactivateRepo(fromRepo);
	}

	// move all markers referencing a repo to another repo
	async moveMarkersToRepo (fromRepo, toRepo) {
		const query = {
			teamId: fromRepo.teamId,
			repoId: fromRepo.id
		};
		const op = {
			$set: {
				repoId: toRepo.id
			}
		};

		await this.doDirect(`Moving markers from repo ${fromRepo.id} to repo ${toRepo.id}...`, 'markers', query, op);
	}

	// move all reviews referencing a repo to another repo
	async moveReviewsToRepo (fromRepo, toRepo) {
		// unfortunately we have to just fetch all the reviews for the team,
		// since the repo ID is embedded as keys to their attributes
		const reviews = await this.data.reviews.getByQuery(
			{ teamId: fromRepo.teamId },
			{ hint: ReviewIndexes.byTeamId, requestId: this.requestId }
		);
		const reviewsToMove = reviews.filter(review => {
			return (
				(review.reviewChangesets || []).find(cs => cs.repoId === fromRepo.id) ||
				(review.reviewDiffs || {})[fromRepo.id] ||
				(review.checkpointReviewDiffs || []).find(diff => diff.repoId === fromRepo.id)
			);
		});

		for (const review of reviewsToMove) {
			const op = { $set: { } };
			for (const cs of (review.reviewChangesets)) {
				if (cs.repoId === fromRepo.id) {
					cs.repoId = toRepo.id;
					op.$set.reviewChangesets = review.reviewChangesets;
				}
			}
			if ((review.reviewDiffs || {})[fromRepo.id]) {
				review.reviewDiffs[toRepo.id] = review.reviewDiffs[fromRepo.id];
				delete review.reviewDiffs[fromRepo.id];
				op.$set.reviewDiffs = review.reviewDiffs;
			}
			for (const rd of (review.checkpointReviewDiffs)) {
				if (rd.repoId === fromRepo.id) {
					rd.repoId = toRepo.id;
					op.$set.checkpointReviewDiffs = review.checkpointReviewDiffs;
				}
			}

			const query = {
				id: this.data.reviews.objectIdSafe(review.id)
			};
			await this.doDirect(`Moving review from repo ${fromRepo.id} to repo ${toRepo.id}...`, 'reviews', query, op);
		}
	}

	// move all code errors referencing a repo to another repo
	async moveCodeErrorsToRepo (fromRepo, toRepo) {
		// unfortunately we have to just fetch all the code errors for the team,
		// since the repo ID is embedded as keys to the stack traces
		const codeErrors = await this.data.codeErrors.getByQuery(
			{ teamId: fromRepo.teamId },
			{ hint: ReviewIndexes.byLastActivityAt, requestId: this.requestId }
		);
		const codeErrorsToMove = codeErrors.filter(codeError => {
			return (codeError.stackTraces || []).find(stackTrace => stackTrace.repoId === fromRepo.id);
		});

		for (const codeError of codeErrorsToMove) {
			const op = { $set: { } };
			for (const stackTrace of (codeError.stackTraces || [])) {
				if (stackTrace.repoId === fromRepo.id) {
					stackTrace.repoId = toRepo.id;
					op.$set.stackTraces = codeError.stackTraces;
				}
			}

			const query = {
				id: this.data.codeErrors.objectIdSafe(codeError.id)
			};
			await this.doDirect(`Moving code error from repo ${fromRepo.id} to repo ${toRepo.id}...`, 'codeErrors', query, op);
		}
	}
	
	// move repo to commit hash mapping from one repo to another
	async moveReposByCommitHash (fromRepo, toRepo) {
		const query = {
			repoId: fromRepo.id
		};
		const op = {
			$set: {
				repoId: toRepo.id
			}
		};

		await this.doDirect(`Moving repos-by-commit-hash from repo ${fromRepo.id} to repo ${toRepo.id}...`, 'reposByCommitHash', query, op);
	}

	// move file streams from one repo to another
	async moveFileStreams (fromRepo, toRepo) {
		const query = {
			repoId: fromRepo.id
		};
		const op = {
			$set: {
				repoId: toRepo.id
			}
		};

		await this.doDirect(`Moving file streams from repo ${fromRepo.id} to repo ${toRepo.id}...`, 'streams', query, op);
	}

	// TODO? compactifiedModifiedRepos

	// deactivate the repo we merged from
	async deactivateRepo (fromRepo) {
		const query = {
			id: this.data.repos.objectIdSafe(fromRepo.id)
		};
		const op = {
			$set: {
				deactivated: true,
				teamId: `WAS ${fromRepo.teamId}`
			}
		};

		await this.doDirect(`Deactivating and detaching repo ${fromRepo.id} from team ${fromRepo.teamId}...`, 'repos', query, op);
	}

	async doDirect (msg, collection, query, op) {
		let log = `${msg}\nON ${collection}:\n${JSON.stringify(query, undefined, 10)}\nOP:\n${JSON.stringify(op, undefined, 10)}`;
		if (this.dryRun) {
			this.log(`WOULD HAVE PERFORMED: ${log}`);
		} else {
			this.log(log);
		}
		if (!this.dryRun) {
			if (!this.data[collection]) {
				this.log(`NOTE: NO ${collection}, skipping...`);
				return;
			}
			await this.data[collection].updateDirect(query, op, { requestId: this.requestId });
		}
	}

	warn (msg) {
		this.logger.warn('*************************************************************************************');
		this.logger.warn(`${this.requestId || ''} ${msg}`);
		this.logger.warn('*************************************************************************************');
	}
	
	log (msg) {
		this.logger.log(`${this.requestId || ''} ${msg}`);
	}
}

module.exports = RepoMerger;