'use strict';

var CodeStream_API_Test = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class ACL_Test extends CodeStream_API_Test {

	get description () {
		return `should return an error when trying to create a ${this.type} stream in a team that i\'m not a member of`;
	}

	get method () {
		return 'post';
	}

	get path () {
		return '/streams';
	}

	get_expected_error () {
		return {
			code: 'RAPI-1011'
		};
	}

	before (callback) {
		Bound_Async.series(this, [
			this.create_other_user,
			this.create_other_repo,
			this.make_stream_data
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

	create_other_repo (callback) {
		this.repo_factory.create_random_repo(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				this.repo = response.repo;
				callback();
			},
			{
				with_random_emails: 2,
				token: this.other_user_data.access_token
			}
		);
	}

	make_stream_data (callback) {
		this.stream_factory.get_random_stream_data(
			(error, data) => {
				if (error) { return callback(error); }
				this.data = data;
				callback();
			},
			{
				type: this.type,
				team_id: this.team._id,
				repo_id: this.type === 'file' ? this.repo._id : null
			}
		);
	}
}

module.exports = ACL_Test;
