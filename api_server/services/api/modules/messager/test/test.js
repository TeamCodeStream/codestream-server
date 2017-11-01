'use strict';

var Me_Channel_Test = require('./me_channel_test');
var Team_Channel_Test = require('./team_channel_test');

// make jshint happy
/* globals describe */

describe('messages', function() {

	this.timeout(10000);

	new Me_Channel_Test().test();
	new Team_Channel_Test().test();

});
