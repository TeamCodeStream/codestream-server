'use strict';

var API_Request_Test = require('./api_request_test');
var Random_User_Factory = require(process.env.CI_API_TOP + '/services/api/modules/users/test/random_user_factory');
var Random_Team_Factory = require(process.env.CI_API_TOP + '/services/api/modules/teams/test/random_team_factory');
var Random_Repo_Factory = require(process.env.CI_API_TOP + '/services/api/modules/repos/test/random_repo_factory');
/*
var Random_Post_Factory = require(process.env.CI_API_TOP + '/services/api/modules/posts/test/random_post_factory');
*/

class CodeStream_API_Test extends API_Request_Test {

	constructor (options) {
		super(options);
		this.user_factory = new Random_User_Factory({
			api_requester: this
		});
		this.team_factory = new Random_Team_Factory({
			api_requester: this,
			user_factory: this.user_factory
		});
		this.repo_factory = new Random_Repo_Factory({
			api_requester: this,
			team_factory: this.team_factory
		});
/*
		this.post_factory = new Random_Post_Factory({
			api_requester: this,
			group_factory: this.group_factory
		});
*/
	}

	authenticate (callback) {
		if (this.dont_want_token()) {
			return callback();
		}
		this.user_factory.create_random_user(
			(error, data) => {
				if (error) { return callback(error); }
				this.current_user = data.user;
				this.token = data.access_token;
				callback();
			},
			this.user_options || {}
		);
	}

	dont_want_token () {
		return false;
	}
}

module.exports = CodeStream_API_Test;
