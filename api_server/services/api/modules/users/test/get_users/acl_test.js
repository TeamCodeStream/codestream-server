'use strict';

var CodeStream_API_Test = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class ACL_Test extends CodeStream_API_Test {

	get description () {
		return 'should return an error when trying to fetch users from a team i\'m not a member of';
	}

	get_expected_error () {
		return {
			code: 'RAPI-1009'
		};
	}

	before (callback) {
		Bound_Async.series(this, [
			this.create_other_user,
			this.create_other_repo
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
				this.path = '/users?team_id=' + response.team._id;
				callback();
			},
			{
				with_random_emails: 2,
				token: this.other_user_data.access_token
			}
		);
	}
}

module.exports = ACL_Test;
