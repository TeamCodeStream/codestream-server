'use strict';

var Me_Channel_Test = require('./me_channel_test');
var Team_Channel_Test = require('./team_channel_test');
var Stream_Channel_Test = require('./stream_channel_test');
var Me_Channel_ACL_Test = require('./me_channel_acl_test');
var Team_Channel_ACL_Test = require('./team_channel_acl_test');
var Stream_Channel_ACL_Test = require('./stream_channel_acl_test');
var Stream_Channel_Team_ACL_Test = require('./stream_channel_team_acl_test');
var Add_To_Created_Team_Test = require('./add_to_created_team_test');
var Add_To_Existing_Team_Test = require('./add_to_existing_team_test');
var Add_Existing_Repo_Test = require('./add_existing_repo_test');

// make jshint happy
/* globals describe */

describe('messages', function() {

	this.timeout(10000);

	new Me_Channel_Test().test();
	new Team_Channel_Test().test();
	new Stream_Channel_Test().test();
	new Me_Channel_ACL_Test().test();
	new Team_Channel_ACL_Test().test();
	new Stream_Channel_ACL_Test().test();
	new Stream_Channel_Team_ACL_Test().test();
	new Add_To_Created_Team_Test().test();
	new Add_To_Existing_Team_Test().test();
	new Add_Existing_Repo_Test().test();

});
