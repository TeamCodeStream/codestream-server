'use strict';

var MeChannelTest = require('./me_channel_test');
var TeamChannelTest = require('./team_channel_test');
var StreamChannelTest = require('./stream_channel_test');
var MeChannel_ACLTest = require('./me_channel_acl_test');
var TeamChannel_ACLTest = require('./team_channel_acl_test');
var StreamChannel_ACLTest = require('./stream_channel_acl_test');
var StreamChannelTeam_ACLTest = require('./stream_channel_team_acl_test');
var AddToCreatedTeamTest = require('./add_to_created_team_test');
var AddToExistingTeamTest = require('./add_to_existing_team_test');
var AddExistingRepoTest = require('./add_existing_repo_test');

// make jshint happy
/* globals describe */

describe('messages', function() {

	this.timeout(10000);

	new MeChannelTest().test();
	new TeamChannelTest().test();
	new StreamChannelTest().test();
	new MeChannel_ACLTest().test();
	new TeamChannel_ACLTest().test();
	new StreamChannel_ACLTest().test();
	new StreamChannelTeam_ACLTest().test();
	new AddToCreatedTeamTest().test();
	new AddToExistingTeamTest().test();
	new AddExistingRepoTest().test();

});
