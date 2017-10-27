'use strict';

var CodeStream_API_Test = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');
const Stream_Test_Constants = require('../stream_test_constants');

class Get_Streams_Test extends CodeStream_API_Test {

	before (callback) {
		this.users_by_team = {};
		Bound_Async.series(this, [
			this.create_other_user,
			this.create_repo_with_me,
			this.create_repo_without_me,
			this.create_channel_direct_streams,
			this.create_file_streams,
			this.set_path
		], callback);
	}

	create_other_user (callback) {
		this.user_factory.create_random_user(
			(error, response) => {
				if (error) { return callback(error); }
				this.other_user_data = response;
				callback();
			}
		);
	}

	create_repo_with_me (callback) {
		let options = {
			with_emails: [this.current_user.email],
			with_random_emails: 2,
			token: this.other_user_data.access_token
		};
		this.repo_factory.create_random_repo(
			(error, response) => {
				if (error) { return callback(error); }
				this.my_repo = response.repo;
				this.my_team = response.team;
				this.users_by_team[this.my_team._id] = response.users.filter(user => {
					return user._id !== this.current_user._id && user._id !== this.other_user_data.user._id;
				});
				callback();
			},
			options
		);
	}

	create_repo_without_me (callback) {
		let options = {
			with_emails: [this.users_by_team[this.my_team._id][0].email],
			with_random_emails: 1,
			token: this.other_user_data.access_token
		};
		this.repo_factory.create_random_repo(
			(error, response) => {
				if (error) { return callback(error); }
				this.foreign_repo = response.repo;
				this.foreign_team = response.team;
				this.users_by_team[this.foreign_team._id] = response.users;
				callback();
			},
			options
		);
	}

	create_channel_direct_streams (callback) {
		this.streams_by_team = {};
		Bound_Async.forEachSeries(
			this,
			[this.my_team, this.foreign_team],
			this.create_channel_direct_streams_for_team,
			callback
		);
	}

	create_channel_direct_streams_for_team (team, callback) {
		this.streams_by_team[team._id] = [];
		Bound_Async.forEachSeries(
			this,
			['channel', 'direct'],
			(type, foreach_callback) => {
				this.create_streams_for_team(team, type, foreach_callback);
			},
			callback
		);
	}

	create_streams_for_team (team, type, callback) {
		Bound_Async.timesSeries(
			this,
			2,
			(n, times_callback) => {
				this.create_stream_for_team(team, type, n, times_callback);
			},
			callback
		);
	}

	create_stream_for_team (team, type, n, callback) {
		let user = this.users_by_team[team._id][n];
		let options = {
			team_id: team._id,
			type: type,
			member_ids: [user._id],
			token: this.other_user_data.access_token
		};
		if (n % 2 === 1) {
			options.member_ids.push(this.current_user._id);
		}

		this.stream_factory.create_random_stream(
			(error, response) => {
				if (error) { return callback(error); }
				this.streams_by_team[team._id].push(response.stream);
				callback();
			},
			options
		);
	}

	create_file_streams (callback) {
		this.streams_by_repo = {};
		Bound_Async.forEachSeries(
			this,
			[this.my_repo, this.foreign_repo],
			this.create_file_streams_for_repo,
			callback
		);
	}

	create_file_streams_for_repo (repo, callback) {
		this.streams_by_repo[repo._id] = [];
		Bound_Async.timesSeries(
			this,
			3,
			(n, times_callback) => {
				this.create_file_stream_for_repo(repo, times_callback);
			},
			callback
		);
	}

	create_file_stream_for_repo (repo, callback) {
		let options = {
			team_id: repo.team_id,
			repo_id: repo._id,
			type: 'file',
			token: this.other_user_data.access_token
		};
		this.stream_factory.create_random_stream(
			(error, response) => {
				if (error) { return callback(error); }
				this.streams_by_repo[repo._id].push(response.stream);
				callback();
			},
			options
		);
	}

	validate_response (data) {
		this.validate_matching_objects(this.my_streams, data.streams, 'streams');
		this.validate_sanitized_objects(data.streams, Stream_Test_Constants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = Get_Streams_Test;
