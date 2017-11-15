'use strict';

var APIRequestTest = require('./api_request_test');
var RandomUserFactory = require(process.env.CS_API_TOP + '/services/api/modules/users/test/random_user_factory');
var RandomTeamFactory = require(process.env.CS_API_TOP + '/services/api/modules/teams/test/random_team_factory');
var RandomRepoFactory = require(process.env.CS_API_TOP + '/services/api/modules/repos/test/random_repo_factory');
var RandomStreamFactory = require(process.env.CS_API_TOP + '/services/api/modules/streams/test/random_stream_factory');
var RandomPostFactory = require(process.env.CS_API_TOP + '/services/api/modules/posts/test/random_post_factory');

class CodeStreamAPITest extends APIRequestTest {

	constructor (options) {
		super(options);
		this.userFactory = new RandomUserFactory({
			apiRequester: this
		});
		this.teamFactory = new RandomTeamFactory({
			apiRequester: this,
			userFactory: this.userFactory
		});
		this.repoFactory = new RandomRepoFactory({
			apiRequester: this,
			teamFactory: this.teamFactory,
			userFactory: this.userFactory
		});
		this.streamFactory = new RandomStreamFactory({
			apiRequester: this
		});
		this.postFactory = new RandomPostFactory({
			apiRequester: this
		});
	}

	authenticate (callback) {
		if (this.dontWantToken()) {
			return callback();
		}
		this.userFactory.createRandomUser(
			(error, data) => {
				if (error) { return callback(error); }
				this.currentUser = data.user;
				this.token = data.accessToken;
				callback();
			},
			this.userOptions || {}
		);
	}

	dontWantToken () {
		return false;
	}
}

module.exports = CodeStreamAPITest;
