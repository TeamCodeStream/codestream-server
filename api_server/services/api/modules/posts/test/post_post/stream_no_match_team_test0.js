'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class StreamNoMatchTeamTest extends CodeStreamAPITest {

	get description () {
		return 'should return an error when trying to fetch posts from a stream where the team doesn\'t match';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'stream'
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
				this.lastUsers = response.users;
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
				type: 'channel',
				teamId: this.lastTeamId,
				memberIds: [this.lastUsers[0]._id],
				token: this.token
			}
		);
	}

	setPath (callback) {
		let teamId = this.teams[0]._id;
		let streamId = this.streams[1]._id;
		this.path = `/posts?teamId=${teamId}&streamId=${streamId}`;
		callback();
	}
}

module.exports = StreamNoMatchTeamTest;
