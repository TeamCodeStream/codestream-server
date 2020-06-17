#!/usr/bin/env node

//desc// merge a repo's remotes to another, delete the merged repo, and adjust all codemarks, file streams, and markers accordingly

/* eslint no-console: 0 */

'use strict';

const MongoClient = require(process.env.CS_API_TOP + '/server_utils/mongo/mongo_client');
const ApiConfig = require(process.env.CS_API_TOP + '/config/config');
const Commander = require('commander');
const FS = require('fs');

// need these collections from mongo
const COLLECTIONS = ['repos', 'markers', 'streams', 'users', 'reviews'];

Commander
	.option('-f, --fromRepo <repoId>', 'ID of the repo to merge and delete')
	.option('-t, --toRepo <repoId>', 'ID of the repo to merge to, if not provided a new repo will be created')
	.option('-m, --mappings <mappings>', 'Mappings file which maps commit SHAs from the repo being merged')
	.option('-p, --pathToPrepend <pathToPrepend>', 'Append this path part to the path for files from the repo being merged')
	.option('--dryrun', 'Do a dry run with informational messages, but don\'t actually DO anything')
	.option('--verbose', 'Output verbose logging messages (mainly having to do with reviews')
	.option('--throttle <throttle>', 'Time to wait for each operation, to avoid mongo overload')
	.parse(process.argv);

if (!Commander.fromRepo || !Commander.toRepo) {
	Commander.help();
}

class RepoMerger {

	// main entry point
	async go (options = {}) {
		try {
			Object.assign(this, options);
			this.config = ApiConfig.getPreferredConfig();
			await this.openMongoClient();
			await this.process();
			this.log('DONE');
		}
		catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			console.error(`Merge failed: ${message}`);
			if (error instanceof Error) {
				console.error(error.stack);
			}
		}
		process.exit();
	}

	wait (n) {
		return new Promise(resolve => {
			setTimeout(resolve, n);
		});
	}

	// open a mongo client to read from
	async openMongoClient () {
		this.mongoClient = new MongoClient({ collections: COLLECTIONS });
		try {
			await this.mongoClient.openMongoClient(this.config.mongo);
			this.data = this.mongoClient.mongoCollections;
		}
		catch (error) {
			throw `unable to open mongo client: ${JSON.stringify(error)}`;
		}
	}

	async process () {
		await this.readMappings();
		await this.getRepos();
		await this.copyCommitHashes();
		await this.convertFileStreams();
		await this.convertMarkers();
		await this.convertReviews();
	}

	async readMappings () {
		if (!this.mappingsFile) { 
			this.mappings = {};
			return;
		}
		this.log('Reading mappings file...');
		return new Promise((resolve, reject) => {
			let data;
			try {
				data = FS.readFileSync(this.mappingsFile).toString();
			}
			catch (error) {
				const message = error instanceof Error ? error.message : JSON.stringify(error);
				return reject(`Unable to read mappings file: ${message}`);
			}

			try {
				data = data.split('\n');
				this.mappings = {};
				data.forEach(line => {
					line = line.trim();
					if (!line || line.startsWith('old')) return;
					const map = line.split(' ');
					this.mappings[map[0]] = map[1];
				});
			}
			catch (error) {
				const message = error instanceof Error ? error.message : JSON.stringify(error);
				throw 'Unable to parse mappings json data: ' + message;
			}
			resolve();
		});
	}

	async getRepos () {
		this.log('Finding repos...');
		this.fromRepo = await this.data.repos.getById(this.fromRepoId);
		if (!this.fromRepo) {
			throw `Repo ${Commander.fromRepo} not found`;
		}
		this.toRepo = await this.data.repos.getById(this.toRepoId);
		if (!this.toRepo) {
			throw `Repo ${Commander.toRepo} not found`;
		}

		if (this.fromRepo.teamId !== this.toRepo.teamId) {
			throw 'Repos must be from the same team';
		}
	}

	async copyCommitHashes () {
		this.log('Copying commit hashes...');
		const toRepoHashes = this.toRepo.knownCommitHashes || [];
		(this.fromRepo.knownCommitHashes || []).forEach(fromHash => {
			const toHash = this.mappings[fromHash] || fromHash;
			toRepoHashes.push(toHash);
		});
		try {
			if (this.dryrun) {
				const numHashes = (this.fromRepo.knownCommitHashes || []).length;
				return this.log(`    (Would have copied ${numHashes} known commit hashes)`);
			}
			await this.data.repos.updateDirect(
				{ id: this.data.repos.objectIdSafe(this.toRepo.id) },
				{ $set: { knownCommitHashes: toRepoHashes } }
			);
		}
		catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			throw `Unable to copy commit hashes: ${message}`;
		}
	}

	async convertFileStreams () {
		this.log('Converting file streams...');
		const fileStreams = await this.data.streams.getByQuery(
			{
				teamId: this.fromRepo.teamId,
				repoId: this.fromRepo.id
			},
			{
				overrideHintRequired: true
			}
		);

		for (const stream of fileStreams) {
			await this.convertFileStream(stream);
		}
		if (this.dryrun) {
			this.log(`    (Would have converted ${fileStreams.length} file streams)`);
		}
		else {
			this.log(`Converted ${fileStreams.length} file streams`);
		}
	}

	async convertFileStream (stream) {
		this.log(`\tStream ${stream.id}...`);
		const set = {
			repoId: this.toRepo.id,
			file: `${this.pathToPrepend}/${stream.file}`
		};
		if (!this.dryrun) {
			await this.data.streams.updateDirect(
				{ id: this.data.streams.objectIdSafe(stream.id) },
				{ $set: set }
			);
			await this.wait(this.throttle);
		}
	}

	async convertMarkers () {
		this.log('Converting markers...');
		const markers = await this.data.markers.getByQuery(
			{
				teamId: this.fromRepo.teamId,
				repoId: this.fromRepo.id
			},
			{
				overrideHintRequired: true
			}
		);

		for (const marker of markers) {
			await this.convertMarker(marker);
		}
		if (this.dryrun) {
			this.log(`    (Would have converted ${markers.length} markers)`);
		}
		else {
			this.log(`Converted ${markers.length} markers`);
		}
	}

	async convertMarker (marker) {
		this.log(`\tMarker ${marker.id}`);
		const set = { 
			repoId: this.toRepo.id
		};
		if (marker.file) {
			set.file = `${this.pathToPrepend}/${marker.file}`;
		}
		if (!marker.referenceLocations && marker.commitHashWhenCreated && marker.locationWhenCreated) {
			set.referenceLocations = [{
				commitHash: this.mappings[marker.commitHashWhenCreated] || marker.commitHashWhenCreated,
				location: marker.locationWhenCreated,
				flags: {
					convertedForMonoRepo: true
				}
			}];
		}
		else {
			set.referenceLocations = [];
			marker.referenceLocations.forEach(rl => {
				rl.commitHash = this.mappings[rl.commitHash] || rl.commitHash;
				set.referenceLocations.push(rl);
			});
		}

		if (!this.dryrun) {
			await this.data.markers.updateDirect(
				{ id: this.data.markers.objectIdSafe(marker.id) }, 
				{ $set: set }
			);
			await this.wait(this.throttle);
		}
	}

	async convertReviews () {
		this.log('Converting reviews...');
		let reviews = await this.data.reviews.getByQuery(
			{
				teamId: this.fromRepo.teamId
			},
			{
				overrideHintRequired: true
			}
		);
		reviews = reviews.filter(review => {
			return (review.reviewChangesets || []).find(changeset => changeset.repoId === this.fromRepo.id);
		});

		for (const review of reviews) {
			await this.convertReview(review);
		}
		if (this.dryrun) {
			this.log(`    (Would have converted ${reviews.length} reviews)`);
		}
		else {
			this.log(`Converted ${reviews.length} reviews`);
		}
	}

	async convertReview (review) {
		this.log(`\tReview ${review.id}...`);
		this.convertReviewChangesets(review);
		this.convertReviewDiffs(review.reviewDiffs);
		this.convertCheckpointReviewDiffs(review.checkpointReviewDiffs);

		const set = {
			reviewChangesets: review.reviewChangesets,
			reviewDiffs: review.reviewDiffs,
			checkpointReviewDiffs: review.checkpointReviewDiffs
		};
		if (!this.dryrun) {
			await this.data.reviews.updateDirect(
				{ id: this.data.reviews.objectIdSafe(review.id) }, 
				{ $set: set }
			);
			await this.wait(this.throttle);
		}
	}

	convertReviewChangesets (review) {
		this.debug(`\tConverting ${review.reviewChangesets.length} change sets...`);
		let n = 0;
		review.reviewChangesets.forEach(changeset => {
			n++;
			this.debug(`\t\tChangeset ${n}`);
			this.debug(`\t\t\tSetting the repo ID to ${this.toRepo.id}`);
			changeset.repoId = this.toRepo.id;
			this.convertChangesetCommits(changeset);
			if (changeset.modifiedFiles) {
				this.convertChangesetModifiedFiles(changeset.modifiedFiles);
			}
			if (changeset.modifiedFilesInCheckpoint) {
				this.convertChangesetModifiedFiles(changeset.modifiedFilesInCheckpoint);
			}
		});
	}

	convertChangesetCommits (changeset) {
		this.debug(`\t\t\tConverting ${(changeset.commits || []).length} commits...`);
		(changeset.commits || []).forEach(commit => {
			if (commit.info && commit.info.ref) {
				const oldRef = commit.info.ref;
				commit.info.ref = this.mappings[commit.info.ref] || commit.info.ref;
				this.debug(`\t\t\t\tref ${oldRef} to ${commit.info.ref}`);
			}
			if (commit.sha) {
				const oldSha = commit.sha;
				commit.sha = this.mappings[commit.sha] || commit.sha;
				this.debug(`\t\t\t\tsha ${oldSha} to ${commit.sha}`);
			}
		});
	}

	convertChangesetModifiedFiles (modifiedFiles) {
		this.debug(`\t\t\tConverting ${(modifiedFiles || []).length} modified files...`);
		(modifiedFiles || []).forEach(file => {
			if (file.file) {
				const oldFile = file.file;				
				file.file = `${this.pathToPrepend}/${file.file}`;
				this.debug(`\t\t\t\tfile ${oldFile} to ${file.file}`);
			}
			if (file.oldFile) {
				const oldOldFile = file.oldFile;
				file.oldFile = `${this.pathToPrepend}/${file.oldFile}`;
				this.debug(`\t\t\t\toldFile ${oldOldFile} to ${file.oldFile}`);
			}
		});
	}

	convertReviewDiffs (reviewDiffs) {
		reviewDiffs[this.toRepo.id] = reviewDiffs[this.fromRepo.id];
		delete reviewDiffs[this.fromRepo.id];
		this.debug(`\treivewDiffs repo ID ${this.fromRepo.id} became ${this.toRepo.id}}`);
		const reviewDiff = reviewDiffs[this.toRepo.id];
		this.debug('\tConverting review diff...');
		this.convertReviewDiff(reviewDiff);
	}

	convertCheckpointReviewDiffs (checkpointReviewDiffs) {
		this.debug(`\tConverting ${(checkpointReviewDiffs || []).length} checkpoint review diffs...`);
		(checkpointReviewDiffs || []).forEach(reviewDiff => {
			if (reviewDiff.repoId === this.fromRepo.id) {
				reviewDiff.repoId = this.toRepo.id;
				this.debug(`\t\tCheckpoint reviewDiff repo ID became ${reviewDiff.repoId}`);
			}
			this.convertReviewDiff(reviewDiff.diffs);
		});
	}
	
	convertReviewDiff (reviewDiff) {
		[
			'leftBaseSha',
			'rightBaseSha',
			'latestCommitSha'
		].forEach(shaField => {
			if (reviewDiff[shaField]) {
				const oldField = reviewDiff[shaField];
				reviewDiff[shaField] = this.mappings[reviewDiff[shaField]] || reviewDiff[shaField];
				this.debug(`\t\t${shaField} from ${oldField} to ${reviewDiff[shaField]}`);
			}
		});
		
		[
			'leftDiffs',
			'rightDiffs',
			'rightReverseDiffs',
			'rightToLatestCommitDiffs',
			'latestCommitToRightDiffs'
		].forEach(diffField => {
			if (reviewDiff[diffField]) {
				this.debug(`\t\tConverting diffs for ${diffField}`);
				this.convertDiffs(reviewDiff[diffField]);
			}
		});

		delete reviewDiff[this.fromRepo.id];
	}

	convertDiffs (diffs) {
		this.debug(`\t\t\tConverting ${diffs.length} diffs...`);
		diffs.forEach(diff => this.convertDiff(diff));		
	}

	convertDiff (diff) {
		if (diff.oldFileName) {
			const oldFileName = diff.oldFileName;
			diff.oldFileName = `${this.pathToPrepend}/${diff.oldFileName}`;
			this.debug(`\t\t\t\toldFileName from ${oldFileName} to ${diff.oldFileName}`);
		}
		if (diff.newFileName) {
			const newFileName = diff.newFileName;
			diff.newFileName = `${this.pathToPrepend}/${diff.newFileName}`;
			this.debug(`\t\t\t\tnewFileName from ${newFileName} to ${diff.newFileName}`);
		}
	}

	log (msg) {
		console.log(msg);
	}

	debug (msg) {
		if (this.verbose) {
			console.log(msg);
		}
	}
}

(async function() {
	try {
		await ApiConfig.loadPreferredConfig();
		await new RepoMerger().go({
			fromRepoId: Commander.fromRepo,
			toRepoId: Commander.toRepo,
			mappingsFile: Commander.mappings,
			remote: Commander.remote,
			pathToPrepend: Commander.pathToPrepend,
			dryrun: Commander.dryrun,
			verbose: Commander.verbose,
			throttle: Commander.throttle ? parseInt(Commander.throttle, 10) : 0
		});
	}
	catch (error) {
		console.error(error);
		process.exit();
	}
})();


