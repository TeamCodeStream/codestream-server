'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

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

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			this.createReposAndStreams,	// create two team/repo/stream series
			this.setPath				// set the path for the fetch request
		], callback);
	}

	// create two sets of repos and streams (and teams), we'll try to fetch from
	// one with a teamId matching the other
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

	// create a repo and a stream in that repo
	createRepoAndStream (n, callback) {
		BoundAsync.series(this, [
			this.createRepo,
			this.createStream
		], callback);
	}

	// create a single repo
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

	// create a single stream in the last repo we created
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
				memberIds: [this.lastUsers[0]._id], // put one of the users on the team in the stream
				token: this.token
			}
		);
	}

	// set the path to use in the fetch request
	setPath (callback) {
		// here the teamId won't match the team that owns the stream 
		let teamId = this.teams[0]._id;
		let streamId = this.streams[1]._id;
		this.path = `/posts?teamId=${teamId}&streamId=${streamId}`;
		callback();
	}
}

module.exports = StreamNoMatchTeamTest;
