// handle unit tests for the "PUT /grant/:channel" request

'use strict';

const MeChannelGrantTest = require('./me_channel_grant_test');
const TeamChannelGrantTest = require('./team_channel_grant_test');
//const StreamChannelGrantTest = require('./stream_channel_grant_test');
const UserChannelACLTest = require('./user_channel_acl_test');
const TeamChannelACLTest = require('./team_channel_acl_test');
//const StreamChannelACLTest = require('./stream_channel_acl_test');
//const OtherStreamChannelACLTest = require('./other_stream_channel_acl_test');
const NonUserChannelACLTest = require('./non_user_channel_acl_test');
const NonTeamChannelACLTest = require('./non_team_channel_acl_test');
//const NonStreamChannelACLTest = require('./non_stream_channel_acl_test');
const InvalidChannelTest = require('./invalid_channel_test');

class GrantRequestTester {

	grantTest () {
		new MeChannelGrantTest().test();
		new TeamChannelGrantTest().test();
		//new StreamChannelGrantTest().test(); // deprecated
		new UserChannelACLTest().test();
		new TeamChannelACLTest().test();
		//new StreamChannelACLTest().test(); // deprecated
		//new OtherStreamChannelACLTest().test(); // deprecated
		new NonUserChannelACLTest().test();
		new NonTeamChannelACLTest().test();
		//new NonStreamChannelACLTest().test(); // deprecated
		new InvalidChannelTest().test();
	}
}

module.exports = GrantRequestTester;
