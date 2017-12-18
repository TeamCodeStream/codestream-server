'use strict';

var MeChannelTest = require('./me_channel_test');
var TeamChannelTest = require('./team_channel_test');
var StreamChannelTest = require('./stream_channel_test');
var MeChannelACLTest = require('./me_channel_acl_test');
var TeamChannelACLTest = require('./team_channel_acl_test');
var StreamChannelACLTest = require('./stream_channel_acl_test');
var StreamChannelTeamACLTest = require('./stream_channel_team_acl_test');
var AddToCreatedTeamTest = require('./add_to_created_team_test');
var AddToExistingTeamTest = require('./add_to_existing_team_test');
var AddExistingRepoTest = require('./add_existing_repo_test');

// make jshint happy
/* globals describe */

describe('messages', function() {

	this.timeout(20000);

	new MeChannelTest().test();
	new TeamChannelTest().test();
	new StreamChannelTest().test();
	new MeChannelACLTest().test();
	new TeamChannelACLTest().test();
	new StreamChannelACLTest().test();
	new StreamChannelTeamACLTest().test();
	new AddToCreatedTeamTest().test();
	new AddToExistingTeamTest().test();
	new AddExistingRepoTest().test();

});
