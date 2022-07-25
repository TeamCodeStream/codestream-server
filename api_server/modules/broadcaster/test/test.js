'use strict';

const MeChannelTest = require('./me_channel_test');
const MeChannelV3Test = require('./me_channel_v3_test');
const TeamChannelTest = require('./team_channel_test');
const TeamChannelV3Test = require('./team_channel_v3_test');
//const StreamChannelTest = require('./stream_channel_test');
const MeChannelACLTest = require('./me_channel_acl_test');
const MeChannelV3ACLTest = require('./me_channel_v3_acl_test');
const TeamChannelACLTest = require('./team_channel_acl_test');
const TeamChannelV3ACLTest = require('./team_channel_v3_acl_test');
//const StreamChannelACLTest = require('./stream_channel_acl_test');
//const StreamDirectTest = require('./stream_direct_test');
//const StreamDirectACLTest = require('./stream_direct_acl_test');
//const StreamChannelTeamACLTest = require('./stream_channel_team_acl_test');
//const AddToExistingStreamTest = require('./add_to_existing_stream_test');
//const PresenceJoinTest = require('./presence_join_test');
//const PresenceLeaveTest = require('./presence_leave_test');
const V3TokenRevokedOnCreateTeamTest = require('./v3_token_revoked_on_create_team_test');
const V3TokenRevokedOnAddToTeamTest = require('./v3_token_revoked_on_add_to_team_test');
const V3TokenRevokedOnCompanyDeletedTest = require('./v3_token_revoked_on_company_deleted_test');
const V3TokenExpiredTest = require('./v3_token_expired_test');
const RefreshV3TokenTest = require('./refresh_v3_token_test');
const SubscriptionTest = require('./subscription_test');

// make eslint happy
/* globals describe */

describe('messages', function() {

	this.timeout(70000);

	new MeChannelTest().test();
	new MeChannelV3Test().test();
	new TeamChannelTest().test();
	new TeamChannelV3Test().test();
	//new StreamChannelTest().test(); stream channels are deprecated
	new MeChannelACLTest().test();
	new MeChannelV3ACLTest().test();
	new TeamChannelACLTest().test();
	new TeamChannelV3ACLTest().test();
	// new StreamChannelACLTest().test();
	// new StreamDirectTest().test();
	// new StreamDirectACLTest().test();
	// new StreamChannelTeamACLTest().test();
	// new AddToExistingStreamTest().test();
	// new PresenceJoinTest().test();	// This functionality is currently deprecated
	// new PresenceLeaveTest().test(); // Disabled pending further need and investigation
	new V3TokenRevokedOnCreateTeamTest().test();
	new V3TokenRevokedOnAddToTeamTest().test();
	new V3TokenRevokedOnCompanyDeletedTest().test();
	new V3TokenExpiredTest().test();
	new RefreshV3TokenTest().test();
	new SubscriptionTest().test();
	new SubscriptionTest({ useV3BroadcasterToken: true }).test();
});
