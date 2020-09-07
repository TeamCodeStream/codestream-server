'use strict';

const MeChannelTest = require('./me_channel_test');
const TeamChannelTest = require('./team_channel_test');
//const StreamChannelTest = require('./stream_channel_test');
const MeChannelACLTest = require('./me_channel_acl_test');
const TeamChannelACLTest = require('./team_channel_acl_test');
//const StreamChannelACLTest = require('./stream_channel_acl_test');
//const StreamDirectTest = require('./stream_direct_test');
//const StreamDirectACLTest = require('./stream_direct_acl_test');
//const StreamChannelTeamACLTest = require('./stream_channel_team_acl_test');
//const AddToExistingStreamTest = require('./add_to_existing_stream_test');
//const PresenceJoinTest = require('./presence_join_test');
//const PresenceLeaveTest = require('./presence_leave_test');

// make eslint happy
/* globals describe */

describe('messages', function() {

	this.timeout(20000);

	new MeChannelTest().test();
	new TeamChannelTest().test();
	//new StreamChannelTest().test(); stream channels are deprecated
	new MeChannelACLTest().test();
	new TeamChannelACLTest().test();
	// new StreamChannelACLTest().test();
	// new StreamDirectTest().test();
	// new StreamDirectACLTest().test();
	// new StreamChannelTeamACLTest().test();
	// new AddToExistingStreamTest().test();
	// new PresenceJoinTest().test();	// This functionality is currently deprecated
	// new PresenceLeaveTest().test(); // Disabled pending further need and investigation
});
