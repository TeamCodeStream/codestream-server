'use strict';

const OS = require('os');
const Path = require('path');
const NodeGit = require('nodegit');
const GitRepo = require('../git_repo');
const Assert = require('assert');
const Async = require('async');
const TEST_REPO_PATH = process.env.CS_API_TEST_REPO_PATH;

// make eslint happy
/* globals describe, before, beforeEach, it */

// because promises and mocha together suck
// when we can support node 8 with async/await, this should all be refactored
var MyAssert = function(condition, message) {
	/*
	if (!condition) {
		console.error(message);
	}
	*/
	Assert(condition, message);
};
var MyAssertEqual = function(expect, actual, message) {
	/*
	if (expect !== actual) {
		console.error(message);
	}
	*/
	Assert.equal(expect, actual, message);
};

describe('GitRepo', () => {
	const tmpdir = OS.tmpdir();
	const commit1 = '5c255290f37247acb227d9d9e9595d32ef3eb786';
	const commit2 = 'dfa7aeb2db7f5981a07c43f723d5e9df4724429c';
	const commit3 = '1f2a13b7597f67f02ccf4089581f3d956dfea308';
	const commit4 = '7d312dc8cb00194b0506077f3db0e1c9ad4ced2e';
	const commit5 = '6aad7d350476b703a8cb616119fbc100476da25b';
	const commit6 = '7c1e4d89c8d0fea47a9eafbdb80d64d1823a5676';

	before (callback => {
		NodeGit.Repository.open(TEST_REPO_PATH)
			.then(git => {
				this.git = git;
				callback();
			})
			.catch((error) => {
				throw error;
			});
	});

	beforeEach (callback => {
		let error = this.git.setHeadDetached(commit2);
		if (error) { return callback(error); }
		this.repo = new GitRepo(this.git);
		callback();
	});

	describe ('open()', () => {

		it('resolves to a GitRepo when path is valid', callback => {
			GitRepo.open(TEST_REPO_PATH, (error, git) => {
				if (error) { return callback(error); }
				MyAssert(git.isGitRepo, 'isGitRepo is not true');
				callback();
			});
		});

		it('rejects when path does not exist', callback => {
			const nonExistingPath = Path.resolve(tmpdir, 'DoesNotExist');
			GitRepo.open(nonExistingPath, error => {
				MyAssert(error, 'no error returned');
				callback();
			});
		});

		it('rejects when path is not a Git repo', callback => {
			const nonGitPath = tmpdir;
			GitRepo.open(nonGitPath, error => {
				MyAssert(error, 'no error returned');
				callback();
			});
		});

	});

	describe('getCurrentCommit()', () => {

		it('returns current commit info', callback => {
			const repo = this.repo;

			repo.getCurrentCommit((error, commit) => {
				if (error) { return callback(error); }
				MyAssertEqual(commit2, commit.id().tostrS(), 'incorrect commit hash');
				callback();
			});
		});

		it('returns HEAD commit info', callback => {
			const repo = this.repo;

			let error = repo._git.setHeadDetached(commit1);
			if (error) { return callback(error); }

			repo.getCurrentCommit((error, commit) => {
				if (error) { return callback(error); }
				MyAssertEqual(commit1, commit.id().tostrS(), 'incorrect commit hash');
				callback();
			});
		});

	});

	describe('getDeltas()', () => {

		it('returns filename information', callback => {
			const git = this.git;
			const repo = this.repo;

			// Asserts that exists one and only one delta
			// for each specified filename. If a filename
			// is an array, asserts that file is identified
			// as renamed from filename[0] to filename[1].
			function expectFilenames (n, filenames, innerCallback) {
				repo.getCurrentCommit((error, commit) => {
					if (error) { return innerCallback(error); }
					repo.getDeltas(commit, (error, deltas) => {
						if (error) { return innerCallback(error); }
						MyAssertEqual(filenames.length, deltas.length, 'commit ' + n + ': number of deltas not equal to number of filenames');
						for (let i = 0; i < filenames.length; i++) {
							const delta = deltas[i];
							const filename = filenames[i];
							let oldName, newName;
							if (Array.isArray(filename)) {
								oldName = filename[0];
								newName = filename[1];
							} else {
								oldName = newName = filename;
							}
							MyAssertEqual(oldName, delta.oldFile);
							MyAssertEqual(newName, delta.newFile);
						}
						innerCallback();
					});
				});
			}

			Async.series([
				series_callback => {
					git.setHeadDetached(commit1);
					expectFilenames(1, ['file1.js'], series_callback);
				},
				series_callback => {
					git.setHeadDetached(commit2);
					expectFilenames(2, ['file1.js'], series_callback);
				},
				series_callback => {
					git.setHeadDetached(commit3);
					expectFilenames(3, ['file2.js'], series_callback);
				},
				series_callback => {
					git.setHeadDetached(commit4);
					expectFilenames(4, [['file2.js', 'file2renamed.js']], series_callback);
				},
				series_callback => {
					git.setHeadDetached(commit5);
					expectFilenames(5, ['file3.js'], series_callback);
				},
				series_callback => {
					git.setHeadDetached(commit6);
					expectFilenames(6, ['file1.js', 'file3.js'], series_callback);
				}
			], callback);
		});

		it('returns edit information', callback => {

			function expectEdits(actuals, expecteds) {
				MyAssertEqual(actuals.length, expecteds.length, 'number of edits not correct');
				for (let i = 0; i < actuals.length; i++) {
					const actual = actuals[i];
					const expected = expecteds[i];
					MyAssertEqual(actual.delStart, expected.delStart, 'incorrect delStart');
					MyAssertEqual(actual.addStart, expected.addStart, 'incorrect addStart');
					MyAssertEqual(actual.delLength, expected.delLength, 'incorrect delLength');
					MyAssertEqual(actual.addLength, expected.addLength, 'incorrect addLength');
				}
			}

			const git = this.git;
			const repo = this.repo;

			git.setHeadDetached(commit6);

			repo.getCurrentCommit((error, commit) => {
				if (error) { return callback(error); }
				repo.getDeltas(commit, (error, deltas) => {
					if (error) { return callback(error); }
					MyAssertEqual(deltas.length, 2, 'did not get expected number of deltas');
					const file1Delta = deltas[0];
					expectEdits(file1Delta.edits, [
						{ delStart: 2, addStart: 2, delLength: 1, addLength: 2 },
						{ delStart: 7, addStart: 8, delLength: 1, addLength: 2 },
						{ delStart: 13, addStart: 15, delLength: 0, addLength: 5 },
						{ delStart: 15, addStart: 22, delLength: 1, addLength: 1 }
					]);

					const file3Delta = deltas[1];
					expectEdits(file3Delta.edits, [
						{ delStart: 9, addStart: 9, delLength: 4, addLength: 0 }
					]);

					callback();
				});
			});
		});

	});
});
