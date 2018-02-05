'use strict';

var MeChannelGrantTest = require('./me_channel_grant_test');
var TeamChannelGrantTest = require('./team_channel_grant_test');
var RepoChannelGrantTest = require('./repo_channel_grant_test');
var StreamChannelGrantTest = require('./stream_channel_grant_test');
var UserChannelACLTest = require('./user_channel_acl_test');
var TeamChannelACLTest = require('./team_channel_acl_test');
var RepoChannelACLTest = require('./repo_channel_acl_test');
var StreamChannelACLTest = require('./stream_channel_acl_test');
var OtherStreamChannelACLTest = require('./other_stream_channel_acl_test');
var NonUserChannelACLTest = require('./non_user_channel_acl_test');
var NonTeamChannelACLTest = require('./non_team_channel_acl_test');
var NonRepoChannelACLTest = require('./non_repo_channel_acl_test');
var NonStreamChannelACLTest = require('./non_stream_channel_acl_test');
var InvalidChannelTest = require('./invalid_channel_test');

class GrantRequestTester {

	grantTest () {
		new MeChannelGrantTest().test();
		new TeamChannelGrantTest().test();
		new RepoChannelGrantTest().test();
		new StreamChannelGrantTest().test();
		new UserChannelACLTest().test();
		new TeamChannelACLTest().test();
		new RepoChannelACLTest().test();
		new StreamChannelACLTest().test();
		new OtherStreamChannelACLTest().test();
		new NonUserChannelACLTest().test();
		new NonTeamChannelACLTest().test();
		new NonRepoChannelACLTest().test();
		new NonStreamChannelACLTest().test();
		new InvalidChannelTest().test();
	}
}

module.exports = GrantRequestTester;
