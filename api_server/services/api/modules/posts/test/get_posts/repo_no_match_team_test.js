'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class RepoNoMatchTeamTest extends CodeStreamAPITest {

	get description () {
		return 'should return an error when trying to fetch posts for a file where the team doesn\'t match the repo';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'repo'
		};
	}

	before (callback) {
		BoundAsync.series(this, [
			this.createReposAndStreams,
			this.setPath
		], callback);
	}

	createReposAndStreams (callback) {
		this.teams = [];
		this.repos = [];
		this.streams = [];
		BoundAsync.timesSeries(
			this,
			2,
			this.createRepoAndStream,
			callback
		);
	}

	createRepoAndStream (n, callback) {
		BoundAsync.series(this, [
			this.createRepo,
			this.createStream
		], callback);
	}

	createRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.teams.push(response.team);
				this.lastTeamId = response.team._id;
				this.lastRepoId = response.repo._id;
				this.lastUsers = response.users;
				this.repos.push(response.repo);
				callback();
			},
			{
				withRandomEmails: 2,
				token: this.token
			}
		);
	}

	createStream (callback) {
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.streams.push(response.stream);
				callback();
			},
			{
				type: 'file',
				teamId: this.lastTeamId,
				repoId: this.lastRepoId,
				memberIds: [this.lastUsers[0]._id],
				token: this.token
			}
		);
	}

	setPath (callback) {
		let teamId = this.teams[0]._id;
		let repoId = this.repos[1]._id;
		let path = encodeURIComponent(this.streams[1].path);
		this.path = `/posts?teamId=${teamId}&repoId=${repoId}&path=${path}`;
		callback();
	}
}

module.exports = RepoNoMatchTeamTest;
