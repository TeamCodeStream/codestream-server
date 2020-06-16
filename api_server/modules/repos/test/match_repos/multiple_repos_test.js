'use strict';

const MatchRepoTest = require('./match_repo_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class MultipleReposTest extends MatchRepoTest {

	get description () {
		return 'should return the matched repos, when matching some known repos, and create others that are unmatched';
	}

	makeRequestData (callback) {
		BoundAsync.series(this, [
			super.makeRequestData,
			this.makeMoreRepos
		], callback);
	}

	makeMoreRepos (callback) {
		this.expectedRepos = [this.repo];
		BoundAsync.timesSeries(
			this,
			4,
			this.makeRepo,
			callback
		);
	}

	makeRepo (n, callback) {
		const token = this.users[1].accessToken;
		const remotes = [
			this.repoFactory.randomUrl(),
			this.repoFactory.randomUrl(),
			this.repoFactory.randomUrl()
		];
		const commitHashes = [
			this.markerFactory.randomCommitHash(),
			this.markerFactory.randomCommitHash(),
			this.markerFactory.randomCommitHash()
		];
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				if (n === 0) {
					const nonMatchingRemote = this.repoFactory.randomUrl();
					this.data.repos.push({
						remotes: [nonMatchingRemote, remotes[1]]
					});
					const repo = response.repos[0];
					this.expectedRepos.push(repo);
					repo.remotes.push(this.getRemoteObject(nonMatchingRemote));
					repo.modifiedAt = 0; // placeholder
					repo.version = 2;
				}
				else if (n === 1) {
					this.unknownRemote = this.repoFactory.randomUrl();
					this.data.repos.push({
						remotes: [this.unknownRemote]
					});
				}
				else if (n === 2) {
					const nonMatchingRemote = this.repoFactory.randomUrl();
					const nonMatchingCommitHash = this.markerFactory.randomCommitHash();
					this.data.repos.push({
						remotes: [nonMatchingRemote],
						knownCommitHashes: [commitHashes[1], nonMatchingCommitHash]
					});
					const repo = response.repos[0];
					this.expectedRepos.push(repo);
					repo.remotes.push(this.getRemoteObject(nonMatchingRemote));
					repo.knownCommitHashes.push(nonMatchingCommitHash.toLowerCase());
					repo.modifiedAt = 0; // placeholder
					repo.version = 2;
				}
				callback();
			},
			{
				token,
				streamId: this.teamStream.id,
				wantCodemark: true,
				codemarkType: 'comment',
				wantMarkers: 1,
				withRandomStream: true,
				withRemotes: remotes,
				withKnownCommitHashes: commitHashes.slice(1),
				commitHash: commitHashes[0]
			}
		);
	}

	validateResponse (data) {
		const remoteObject = this.getRemoteObject(this.unknownRemote);
		const repo = data.repos[2];
		Assert.deepEqual(repo.remotes, [remoteObject], 'created repo should match the remote passed');
		this.expectedRepos = [
			...this.expectedRepos.slice(0, 2),
			repo,
			...this.expectedRepos.slice(2)
		];
		super.validateResponse(data);
	}
}

module.exports = MultipleReposTest;
