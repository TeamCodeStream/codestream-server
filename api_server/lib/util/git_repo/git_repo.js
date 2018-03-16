// Provides a utility wrapper class to handling git repositories through nodegit

'use strict';

const Git = require('nodegit');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const DeltaBuilder = require('./delta_builder');

class GitRepo {

	constructor (git) {
		this._git = git;
		this.isGitRepo = true;
	}

	getCurrentCommit (callback) {
		this._git.getHeadCommit()
			.then(commit => {
				callback(null, commit);
			})
			.catch(error => {
				throw error;
			});
	}

	getDeltas (commit, callback) {
		this.deltas = [];
		commit.getDiff()
			.then(diffs => {
				this._deltasFromDiffs(diffs, () => {
					callback(null, this.deltas);
				});
			})
			.catch(error => {
				throw error;
			});
	}

	_deltasFromDiffs (diffs, callback) {
		BoundAsync.forEachSeries(
			this,
			diffs,
			this._deltasFromDiff,
			callback
		);
	}

	_deltasFromDiff (diff, callback) {
		diff.findSimilar({
			flags: Git.Diff.FIND.RENAMES
		})
			.then(() => {
				return diff.patches();
			})
			.then((patches) => {
				this._deltasFromPatches(patches, callback);
			})
			.catch(error => {
				throw error;
			});
	}

	_deltasFromPatches (patches, callback) {
		BoundAsync.forEachSeries(
			this,
			patches,
			this._deltasFromPatch,
			callback
		);
	}

	_deltasFromPatch (patch, callback) {
		this.builder = new DeltaBuilder({
			oldFile: patch.oldFile().path(),
			newFile: patch.newFile().path()
		});
		patch.hunks()
			.then(hunks => {
				this._deltasFromHunks(hunks, callback);
			})
			.catch(error => {
				throw error;
			});
	}

	_deltasFromHunks (hunks, callback) {
		BoundAsync.forEachSeries(
			this,
			hunks,
			this._deltasFromHunk,
			error => {
				if (error) { return callback(error); }
				this.deltas.push(this.builder.build());
				callback();
			}
		);
	}

	_deltasFromHunk (hunk, callback) {
		hunk.lines()
			.then(lines => {
				for (const line of lines) {
					this.builder.processLine(line);
				}
				callback();
			})
			.catch(error => {
				throw error;
			});
	}
}

function open (path, callback) {
	Git.Repository.open(path)
		.then(git => {
			callback(null, new GitRepo(git));
		})
		.catch(callback);
}

module.exports = GitRepo;
module.exports.open = open;
