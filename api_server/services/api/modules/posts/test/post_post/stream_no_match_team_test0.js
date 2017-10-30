'use strict';

var CodeStream_API_Test = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class Stream_No_Match_Team_Test extends CodeStream_API_Test {

	get description () {
		return 'should return an error when trying to fetch posts from a stream where the team doesn\'t match';
	}

	get_expected_error () {
		return {
			code: 'RAPI-1003',
			info: 'stream'
		};
	}

	before (callback) {
		Bound_Async.series(this, [
			this.create_repos_and_streams,
			this.set_path
		], callback);
	}

	create_repos_and_streams (callback) {
		this.teams = [];
		this.streams = [];
		Bound_Async.timesSeries(
			this,
			2,
			this.create_repo_and_stream,
			callback
		);
	}

	create_repo_and_stream (n, callback) {
		Bound_Async.series(this, [
			this.create_repo,
			this.create_stream
		], callback);
	}

	create_repo (callback) {
		this.repo_factory.create_random_repo(
			(error, response) => {
				if (error) { return callback(error); }
				this.teams.push(response.team);
				this.last_team_id = response.team._id;
				this.last_users = response.users;
				callback();
			},
			{
				with_random_emails: 2,
				token: this.token
			}
		);
	}

	create_stream (callback) {
		this.stream_factory.create_random_stream(
			(error, response) => {
				if (error) { return callback(error); }
				this.streams.push(response.stream);
				callback();
			},
			{
				type: 'channel',
				team_id: this.last_team_id,
				member_ids: [this.last_users[0]._id],
				token: this.token
			}
		);
	}

	set_path (callback) {
		let team_id = this.teams[0]._id;
		let stream_id = this.streams[1]._id;
		this.path = `/posts?team_id=${team_id}&stream_id=${stream_id}`;
		callback();
	}
}

module.exports = Stream_No_Match_Team_Test;
